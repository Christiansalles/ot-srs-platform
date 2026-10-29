// Teste de integração: PATCH .../status de medição e relatório contra o
// Postgres, sem mock. Cria os próprios usuários, setor, medição (2094) e
// relatório (2093), fora do seed e dos anos usados por outros testes.

const request = require('supertest');
const fs = require('node:fs');
const path = require('node:path');
const prisma = require('../src/db');
const app = require('../src/app');
const { criarToken } = require('../src/services/auth');
const { uploadsDir } = require('../src/config/uploads');

const sufixo = `status-${Date.now()}`;
const ANO_MEDICAO = 2094;
const ANO_RELATORIO = 2093;
const ERRO_PERFIL = { erro: 'Seu perfil não pode publicar conteúdo' };

const segredoAnterior = process.env.JWT_SECRET;
let admin;
let editor;
let inativo;
let setor;
let indicador;
let medicao;
let relatorio;
const tokens = {};

beforeAll(async () => {
  process.env.JWT_SECRET = segredoAnterior || 'segredo-de-teste-com-tamanho-suficiente';

  const usuario = (nome, perfil, ativo = true) => prisma.usuario.create({
    data: { nome, email: `${nome}-${sufixo}@teste.com`, senha_hash: 'x', ativo, perfil },
  });
  admin = await usuario('admin', 'administrador');
  editor = await usuario('editor', 'editor');
  inativo = await usuario('inativo', 'administrador', false);
  tokens.admin = criarToken(admin);
  tokens.editor = criarToken(editor);
  tokens.inativo = criarToken(inativo);

  setor = await prisma.setor.create({ data: { nome: `Setor ${sufixo}` } });
  indicador = await prisma.indicador.create({
    data: { id_setor: setor.id_setor, nome: 'Leitos', unidade: 'leitos' },
  });
  const periodo = await prisma.periodo.upsert({
    where: { ano_semestre: { ano: ANO_MEDICAO, semestre: 2 } },
    update: {},
    create: { ano: ANO_MEDICAO, semestre: 2 },
  });
  medicao = await prisma.medicao.create({
    data: {
      id_indicador: indicador.id_indicador,
      id_periodo: periodo.id_periodo,
      id_usuario: admin.id_usuario,
      valor: 350.5,
      status: 'rascunho',
    },
  });
  relatorio = await prisma.relatorio.create({
    data: {
      id_usuario: admin.id_usuario,
      titulo: `Relatório ${sufixo}`,
      edicao: `${ANO_RELATORIO}/1`,
      categoria: 'Setor Hoteleiro',
      data_publicacao: new Date(`${ANO_RELATORIO}-05-20T00:00:00.000Z`),
      descricao: 'Relatório de teste',
      arquivo_url: `${sufixo}.pdf`,
      tamanho_kb: 80,
      status: 'rascunho',
    },
  });
}, 15000);

afterAll(async () => {
  const ids = [admin, editor, inativo].filter(Boolean).map((u) => u.id_usuario);
  await prisma.relatorio.deleteMany({ where: { id_usuario: { in: ids } } });
  await prisma.medicao.deleteMany({ where: { id_usuario: { in: ids } } });
  if (indicador) await prisma.indicador.delete({ where: { id_indicador: indicador.id_indicador } });
  if (setor) await prisma.setor.delete({ where: { id_setor: setor.id_setor } });
  await prisma.usuario.deleteMany({ where: { id_usuario: { in: ids } } });
  await prisma.$disconnect();

  if (segredoAnterior === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = segredoAnterior;
}, 15000);

function alterarStatus(recurso, id, corpo, token = tokens.admin) {
  const requisicao = request(app).patch(`/api/admin/${recurso}/${id}/status`);
  if (token) requisicao.set('Authorization', `Bearer ${token}`);
  return corpo === undefined ? requisicao : requisicao.send(corpo);
}

const statusNoBanco = {
  medicoes: async () => (await prisma.medicao.findUnique({ where: { id_medicao: medicao.id_medicao } })).status,
  relatorios: async () => (await prisma.relatorio.findUnique({ where: { id_relatorio: relatorio.id_relatorio } })).status,
};
const idDo = { medicoes: () => medicao.id_medicao, relatorios: () => relatorio.id_relatorio };

describe.each(['medicoes', 'relatorios'])('PATCH /api/admin/%s/:id/status', (recurso) => {
  afterEach(async () => {
    if (!admin || !medicao || !relatorio) return;
    // Cada teste começa com o item em rascunho.
    if (recurso === 'medicoes') {
      await prisma.medicao.update({ where: { id_medicao: medicao.id_medicao }, data: { status: 'rascunho' } });
    } else {
      await prisma.relatorio.update({ where: { id_relatorio: relatorio.id_relatorio }, data: { status: 'rascunho' } });
    }
    await prisma.usuario.update({ where: { id_usuario: admin.id_usuario }, data: { perfil: 'administrador' } });
  });

  it.each([
    ['sem token', undefined],
    ['com token inválido', 'nao.e.valido'],
  ])('responde 401 %s', async (_caso, token) => {
    const res = await alterarStatus(recurso, idDo[recurso](), { status: 'publicado' }, token ?? null);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ erro: 'Token inválido ou expirado' });
    expect(await statusNoBanco[recurso]()).toBe('rascunho');
  });

  it('responde 401 para usuário inativo, mesmo administrador', async () => {
    const res = await alterarStatus(recurso, idDo[recurso](), { status: 'publicado' }, tokens.inativo);

    expect(res.status).toBe(401);
    expect(await statusNoBanco[recurso]()).toBe('rascunho');
  });

  it('responde 403 para o editor e não muda o status', async () => {
    const res = await alterarStatus(recurso, idDo[recurso](), { status: 'publicado' }, tokens.editor);

    expect(res.status).toBe(403);
    expect(res.body).toEqual(ERRO_PERFIL);
    expect(await statusNoBanco[recurso]()).toBe('rascunho');
  });

  it('responde 403 ao editor antes de validar o corpo ou o id', async () => {
    const res = await alterarStatus(recurso, 999999999, { status: 'homologado' }, tokens.editor);

    expect(res.status).toBe(403);
    expect(res.body).toEqual(ERRO_PERFIL);
  });

  it('usa o perfil atual do banco, não o do momento do login', async () => {
    await prisma.usuario.update({ where: { id_usuario: admin.id_usuario }, data: { perfil: 'editor' } });

    const res = await alterarStatus(recurso, idDo[recurso](), { status: 'publicado' }, tokens.admin);

    expect(res.status).toBe(403);
    expect(await statusNoBanco[recurso]()).toBe('rascunho');
  });

  it('o administrador publica e despublica', async () => {
    const publicar = await alterarStatus(recurso, idDo[recurso](), { status: 'publicado' });
    expect(publicar.status).toBe(200);
    expect(publicar.body).toMatchObject({ id: idDo[recurso](), status: 'publicado' });
    expect(await statusNoBanco[recurso]()).toBe('publicado');

    const despublicar = await alterarStatus(recurso, idDo[recurso](), { status: 'rascunho' });
    expect(despublicar.status).toBe(200);
    expect(despublicar.body).toMatchObject({ id: idDo[recurso](), status: 'rascunho' });
    expect(await statusNoBanco[recurso]()).toBe('rascunho');
  });

  it.each([
    ['status desconhecido', { status: 'homologado' }],
    ['status com caixa diferente', { status: 'Publicado' }],
    ['status que não é texto', { status: 1 }],
    ['corpo sem status', {}],
    ['sem corpo', undefined],
  ])('responde 400 para %s', async (_caso, corpo) => {
    const res = await alterarStatus(recurso, idDo[recurso](), corpo);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ erro: 'Status inválido' });
    expect(await statusNoBanco[recurso]()).toBe('rascunho');
  });

  it('responde 400 para JSON malformado', async () => {
    const res = await request(app)
      .patch(`/api/admin/${recurso}/${idDo[recurso]()}/status`)
      .set('Authorization', `Bearer ${tokens.admin}`)
      .set('Content-Type', 'application/json')
      .send('{"status":');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ erro: 'JSON inválido' });
  });

  it.each([
    ['id inexistente', '999999999'],
    ['id que não é número', 'abc'],
    ['id zero', '0'],
    ['id acima do limite do banco', '2147483648'],
  ])('responde 404 para %s', async (_caso, id) => {
    const res = await alterarStatus(recurso, id, { status: 'publicado' });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ erro: 'Recurso não encontrado' });
  });
});

describe('formato da resposta', () => {
  afterEach(async () => {
    await prisma.medicao.update({ where: { id_medicao: medicao.id_medicao }, data: { status: 'rascunho' } });
    await prisma.relatorio.update({ where: { id_relatorio: relatorio.id_relatorio }, data: { status: 'rascunho' } });
  });

  it('a medição sai como no GET /api/admin/indicadores, com valor numérico', async () => {
    const res = await alterarStatus('medicoes', medicao.id_medicao, { status: 'publicado' });

    expect(res.body).toEqual({
      id: medicao.id_medicao,
      ano: ANO_MEDICAO,
      semestre: 2,
      valor: 350.5,
      status: 'publicado',
    });
  });

  it('o relatório sai com os campos públicos e o status, sem arquivo_url nem id_usuario', async () => {
    const res = await alterarStatus('relatorios', relatorio.id_relatorio, { status: 'publicado' });

    expect(res.body).toEqual({
      id: relatorio.id_relatorio,
      titulo: `Relatório ${sufixo}`,
      edicao: `${ANO_RELATORIO}/1`,
      categoria: 'Setor Hoteleiro',
      data_publicacao: `${ANO_RELATORIO}-05-20`,
      descricao: 'Relatório de teste',
      tamanho_kb: 80,
      url_arquivo: `/api/relatorios/${relatorio.id_relatorio}/arquivo`,
      status: 'publicado',
    });
  });
});

describe('efeito nas rotas públicas', () => {
  afterEach(async () => {
    await prisma.medicao.update({ where: { id_medicao: medicao.id_medicao }, data: { status: 'rascunho' } });
    await prisma.relatorio.update({ where: { id_relatorio: relatorio.id_relatorio }, data: { status: 'rascunho' } });
  });

  it('a medição só aparece em /api/indicadores e nos destaques depois de publicada', async () => {
    const publicas = async () => Promise.all([
      request(app).get(`/api/indicadores?setor=${setor.id_setor}`),
      request(app).get(`/api/indicadores/destaques?setor=${setor.id_setor}`),
    ]);

    let [lista, destaques] = await publicas();
    expect(lista.body).toEqual([]);
    expect(destaques.body).toEqual([]);

    await alterarStatus('medicoes', medicao.id_medicao, { status: 'publicado' });
    [lista, destaques] = await publicas();
    expect(lista.body).toHaveLength(1);
    expect(lista.body[0].medicoes).toEqual([{ ano: ANO_MEDICAO, semestre: 2, valor: 350.5 }]);
    expect(destaques.body).toEqual([expect.objectContaining({ id: indicador.id_indicador, valor: 350.5 })]);

    await alterarStatus('medicoes', medicao.id_medicao, { status: 'rascunho' });
    [lista, destaques] = await publicas();
    expect(lista.body).toEqual([]);
    expect(destaques.body).toEqual([]);
  });

  it('o relatório só aparece em /api/relatorios depois de publicado', async () => {
    const publicos = async () => (await request(app).get(`/api/relatorios?ano=${ANO_RELATORIO}`)).body;

    expect(await publicos()).toEqual([]);

    await alterarStatus('relatorios', relatorio.id_relatorio, { status: 'publicado' });
    expect((await publicos()).map((item) => item.id)).toEqual([relatorio.id_relatorio]);

    await alterarStatus('relatorios', relatorio.id_relatorio, { status: 'rascunho' });
    expect(await publicos()).toEqual([]);
  });

  it('o download acompanha a publicação e despublicação do relatório', async () => {
    const nomeArquivo = `${sufixo}.pdf`;
    const conteudo = Buffer.from('%PDF-1.4 fluxo de publicação');
    fs.mkdirSync(uploadsDir, { recursive: true });
    fs.writeFileSync(path.join(uploadsDir, nomeArquivo), conteudo);
    try {
      const url = `/api/relatorios/${relatorio.id_relatorio}/arquivo`;
      expect((await request(app).get(url)).status).toBe(404);

      await alterarStatus('relatorios', relatorio.id_relatorio, { status: 'publicado' });
      const download = await request(app).get(url);
      expect(download.status).toBe(200);
      expect(download.body).toEqual(conteudo);

      await alterarStatus('relatorios', relatorio.id_relatorio, { status: 'rascunho' });
      const oculto = await request(app).get(url);
      expect(oculto.status).toBe(404);
      expect(oculto.body).toEqual({ erro: 'Relatório não encontrado' });
    } finally {
      fs.rmSync(path.join(uploadsDir, nomeArquivo), { force: true });
    }
  });
});
