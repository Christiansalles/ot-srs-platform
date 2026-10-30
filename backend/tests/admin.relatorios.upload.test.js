const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const request = require('supertest');

const uploadsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ot-srs-upload-teste-'));
process.env.UPLOADS_DIR = uploadsDir;

const prisma = require('../src/db');
const app = require('../src/app');
const { criarToken } = require('../src/services/auth');

const sufixo = `upload-${Date.now()}`;
const pdf = path.join(__dirname, 'fixtures', 'minimo.pdf');
let usuario;
let token;

beforeAll(async () => {
  process.env.JWT_SECRET ||= 'segredo-de-teste-com-tamanho-suficiente';
  usuario = await prisma.usuario.create({
    data: { nome: 'Upload teste', email: `${sufixo}@teste.com`, senha_hash: 'x', ativo: true, perfil: 'editor' },
  });
  token = criarToken(usuario);
});

afterAll(async () => {
  if (usuario) await prisma.relatorio.deleteMany({ where: { id_usuario: usuario.id_usuario } });
  if (usuario) await prisma.usuario.delete({ where: { id_usuario: usuario.id_usuario } });
  await prisma.$disconnect();
  fs.rmSync(uploadsDir, { recursive: true, force: true });
});

afterEach(() => {
  for (const nome of fs.readdirSync(uploadsDir)) fs.rmSync(path.join(uploadsDir, nome), { force: true });
});

function enviar(tokenAutenticacao = token) {
  const requisicao = request(app).post('/api/admin/relatorios');
  if (tokenAutenticacao) requisicao.set('Authorization', `Bearer ${tokenAutenticacao}`);
  return requisicao
    .field('titulo', 'Relatório enviado')
    .field('edicao', '2098/1')
    .field('categoria', 'Perfil de Demanda')
    .field('data_publicacao', '2098-06-01')
    .field('descricao', 'Relatório temporário de teste');
}

describe('POST /api/admin/relatorios', () => {
  it('salva PDF válido e mantém o novo relatório fora da lista pública', async () => {
    const res = await enviar().attach('arquivo', pdf, { filename: 'relatorio.pdf', contentType: 'application/pdf' });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('rascunho');
    expect(res.body).not.toHaveProperty('arquivo_url');
    const [salvo] = fs.readdirSync(uploadsDir);
    expect(salvo).not.toBe('relatorio.pdf');
    expect(fs.readFileSync(path.join(uploadsDir, salvo))).toEqual(fs.readFileSync(pdf));
    const publico = await request(app).get('/api/relatorios');
    expect(publico.body.map(({ id }) => id)).not.toContain(res.body.id);
  });

  it('rejeita arquivo PNG renomeado como PDF e remove o temporário', async () => {
    const res = await enviar().attach('arquivo', Buffer.from('\x89PNG\r\n\x1a\n'), { filename: 'imagem.pdf', contentType: 'application/pdf' });
    expect(res.status).toBe(400);
    expect(fs.readdirSync(uploadsDir)).toHaveLength(0);
  });

  it('responde 413 para arquivo acima de 10 MiB', async () => {
    const res = await enviar().attach('arquivo', Buffer.alloc(11 * 1024 * 1024, 65), { filename: 'grande.pdf', contentType: 'application/pdf' });
    expect(res.status).toBe(413);
    expect(res.body).toEqual({ erro: expect.any(String) });
    expect(fs.readdirSync(uploadsDir)).toHaveLength(0);
  });

  it('rejeita título ausente', async () => {
    const semTitulo = request(app).post('/api/admin/relatorios').set('Authorization', `Bearer ${token}`)
      .field('edicao', '2098/1').field('categoria', 'Perfil de Demanda')
      .field('data_publicacao', '2098-06-01').field('descricao', 'Teste')
      .attach('arquivo', pdf, { filename: 'relatorio.pdf', contentType: 'application/pdf' });
    expect((await semTitulo).status).toBe(400);
  });

  it('exige token', async () => {
    // A autenticação responde antes do parser multipart; não envie um corpo que
    // o servidor não vai consumir, pois o cliente pode receber ECONNRESET.
    const semToken = await request(app).post('/api/admin/relatorios');
    expect(semToken.status).toBe(401);
  });

  it('rejeita bytes de PDF com tipo MIME diferente de PDF', async () => {
    const res = await enviar().attach('arquivo', fs.readFileSync(pdf), { filename: 'relatorio.png', contentType: 'image/png' });
    expect(res.status).toBe(400);
    expect(fs.readdirSync(uploadsDir)).toHaveLength(0);
  });
});
