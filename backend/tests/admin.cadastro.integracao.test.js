// Integração da E12 contra o PostgreSQL: cadastro, duplicidade e publicação
// de medição por um editor.
const request = require('supertest');
const prisma = require('../src/db');
const app = require('../src/app');
const { criarToken } = require('../src/services/auth');

const sufixo = `e12-${Date.now()}`;
const ano = 3000 + (Date.now() % 1000);
let usuario;
let administrador;
let setor;
let indicador;
let token;
let tokenAdministrador;
const segredoAnterior = process.env.JWT_SECRET;

beforeAll(async () => {
  process.env.JWT_SECRET = segredoAnterior || 'segredo-de-teste-com-tamanho-suficiente';
  usuario = await prisma.usuario.create({
    data: { nome: 'Editora E12', email: `${sufixo}@teste.com`, senha_hash: 'x', ativo: true, perfil: 'editor' },
  });
  token = criarToken(usuario);
  administrador = await prisma.usuario.create({
    data: { nome: 'Admin E12', email: `admin-${sufixo}@teste.com`, senha_hash: 'x', ativo: true, perfil: 'administrador' },
  });
  tokenAdministrador = criarToken(administrador);
  setor = await prisma.setor.create({ data: { nome: `Setor ${sufixo}` } });
});

afterAll(async () => {
  if (indicador) {
    await prisma.medicao.deleteMany({ where: { id_indicador: indicador.id_indicador } });
    await prisma.indicador.delete({ where: { id_indicador: indicador.id_indicador } });
  }
  if (setor) await prisma.setor.delete({ where: { id_setor: setor.id_setor } });
  await prisma.usuario.deleteMany({ where: { id_usuario: { in: [usuario?.id_usuario, administrador?.id_usuario].filter(Boolean) } } });
  await prisma.periodo.deleteMany({ where: { ano } });
  await prisma.$disconnect();
  if (segredoAnterior === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = segredoAnterior;
});

const autenticada = (requisicao) => requisicao.set('Authorization', `Bearer ${token}`);

describe('cadastro e edição de indicador e medição (E12)', () => {
  it('permite ao editor cadastrar, evita duplicata e mantém rascunho fora das rotas públicas', async () => {
    const cadastroIndicador = await autenticada(request(app).post('/api/admin/indicadores'))
      .send({ id_setor: setor.id_setor, nome: `Indicador ${sufixo}`, unidade: 'un' });
    expect(cadastroIndicador.status).toBe(201);
    indicador = await prisma.indicador.findUnique({ where: { id_indicador: cadastroIndicador.body.id } });

    const periodoAntes = await request(app).get('/api/periodos');
    expect(periodoAntes.body.map(({ ano: a }) => a)).not.toContain(ano);

    const corpo = { id_indicador: indicador.id_indicador, ano, semestre: 1, valor: 12 };
    const cadastro = await autenticada(request(app).post('/api/admin/medicoes')).send(corpo);
    expect(cadastro.status).toBe(201);
    expect(cadastro.body).toMatchObject({ ano, semestre: 1, valor: 12, status: 'rascunho' });

    const duplicada = await autenticada(request(app).post('/api/admin/medicoes')).send(corpo);
    expect(duplicada.status).toBe(409);
    expect(duplicada.body).toEqual({ erro: `Já existe uma medição deste indicador em ${ano}/1` });
    expect(await prisma.medicao.count({ where: { id_indicador: indicador.id_indicador } })).toBe(1);

    const publicosAntes = await request(app).get(`/api/indicadores?setor=${setor.id_setor}`);
    expect(publicosAntes.body).toEqual([]);
    const periodosRascunho = await request(app).get('/api/periodos');
    expect(periodosRascunho.body.map(({ ano: a }) => a)).not.toContain(ano);

    const edicao = await autenticada(request(app).put(`/api/admin/medicoes/${cadastro.body.id}`)).send({ valor: 13 });
    expect(edicao.status).toBe(200);
    expect(edicao.body).toMatchObject({ valor: 13, status: 'rascunho' });

    const publicada = await request(app).patch(`/api/admin/medicoes/${cadastro.body.id}/status`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ status: 'publicado' });
    expect(publicada.status).toBe(200);

    const edicaoPublicada = await autenticada(request(app).put(`/api/admin/medicoes/${cadastro.body.id}`))
      .send({ valor: 14 });
    expect(edicaoPublicada.status).toBe(409);
    expect(edicaoPublicada.body).toEqual({ erro: 'Despublique a medição antes de editar' });

    const publicosDepois = await request(app).get(`/api/indicadores?setor=${setor.id_setor}`);
    expect(publicosDepois.body).toHaveLength(1);
    expect(publicosDepois.body[0].medicoes).toEqual([{ ano, semestre: 1, valor: 13 }]);
    const periodosPublicados = await request(app).get('/api/periodos');
    expect(periodosPublicados.body).toContainEqual(expect.objectContaining({ ano, semestre: 1 }));
  });

  it('responde 401 sem token', async () => {
    const resposta = await request(app).post('/api/admin/medicoes')
      .send({ id_indicador: 1, ano, semestre: 2, valor: 1 });
    expect(resposta.status).toBe(401);
  });
});
