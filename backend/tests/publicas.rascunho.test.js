// Regressão da E13: nenhuma rota pública devolve rascunho.
// Teste de integração contra o Postgres, sem mock. Cria um setor com:
// - "Só rascunho": uma medição em rascunho em 2092/1;
// - "Misto": publicada em 2092/2 (valor 20) e rascunho em 2092/1 (valor 999),
//   anterior à publicada, para pegar variação calculada com rascunho;
// e um relatório em rascunho em 2092. 2092 fica fora do seed e dos outros testes.

const request = require('supertest');
const prisma = require('../src/db');
const app = require('../src/app');

const sufixo = `regressao-${Date.now()}`;
const ANO = 2092;
const VALOR_RASCUNHO = 999.25;

let usuario;
let setor;
let soRascunho;
let misto;
let periodo1;
let periodo2;
let relatorio;

beforeAll(async () => {
  usuario = await prisma.usuario.create({
    data: { nome: 'Teste rascunho', email: `${sufixo}@teste.com`, senha_hash: 'x', ativo: false },
  });
  setor = await prisma.setor.create({ data: { nome: `Setor ${sufixo}` } });
  soRascunho = await prisma.indicador.create({
    data: { id_setor: setor.id_setor, nome: 'Só rascunho', unidade: 'un' },
  });
  misto = await prisma.indicador.create({
    data: { id_setor: setor.id_setor, nome: 'Misto', unidade: 'un' },
  });
  const periodo = (semestre) => prisma.periodo.upsert({
    where: { ano_semestre: { ano: ANO, semestre } },
    update: {},
    create: { ano: ANO, semestre },
  });
  periodo1 = await periodo(1);
  periodo2 = await periodo(2);

  const medicao = (indicador, periodoMedicao, valor, status) => ({
    id_indicador: indicador.id_indicador,
    id_periodo: periodoMedicao.id_periodo,
    id_usuario: usuario.id_usuario,
    valor,
    status,
  });
  await prisma.medicao.createMany({
    data: [
      medicao(soRascunho, periodo1, VALOR_RASCUNHO, 'rascunho'),
      medicao(misto, periodo1, VALOR_RASCUNHO, 'rascunho'),
      medicao(misto, periodo2, 20, 'publicado'),
    ],
  });

  relatorio = await prisma.relatorio.create({
    data: {
      id_usuario: usuario.id_usuario,
      titulo: `Rascunho ${sufixo}`,
      edicao: `${ANO}/1`,
      categoria: 'Setor Hoteleiro',
      data_publicacao: new Date(`${ANO}-03-01T00:00:00.000Z`),
      descricao: 'Relatório em rascunho',
      arquivo_url: `${sufixo}.pdf`,
      tamanho_kb: 10,
      status: 'rascunho',
    },
  });
});

afterAll(async () => {
  if (usuario) {
    await prisma.relatorio.deleteMany({ where: { id_usuario: usuario.id_usuario } });
    await prisma.medicao.deleteMany({ where: { id_usuario: usuario.id_usuario } });
  }
  await prisma.indicador.deleteMany({
    where: { id_indicador: { in: [soRascunho, misto].filter(Boolean).map((i) => i.id_indicador) } },
  });
  if (setor) await prisma.setor.delete({ where: { id_setor: setor.id_setor } });
  if (usuario) await prisma.usuario.delete({ where: { id_usuario: usuario.id_usuario } });
  await prisma.$disconnect();
});

// Nada de rascunho pode vazar pelo texto da resposta: nem o status, nem o
// valor, nem o título do relatório.
function semRascunho(body) {
  const texto = JSON.stringify(body);
  expect(texto).not.toContain('rascunho');
  expect(texto).not.toContain(String(VALOR_RASCUNHO));
  expect(texto).not.toContain(`Rascunho ${sufixo}`);
}

describe('rotas públicas não devolvem rascunho', () => {
  it('GET /api/periodos não lista período que só tem rascunho', async () => {
    const res = await request(app).get('/api/periodos');

    expect(res.status).toBe(200);
    const ids = res.body.map((item) => item.id);
    expect(ids).toContain(periodo2.id_periodo);
    expect(ids).not.toContain(periodo1.id_periodo);
  });

  it('GET /api/indicadores do setor traz só o indicador e a medição publicados', async () => {
    const res = await request(app).get(`/api/indicadores?setor=${setor.id_setor}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ id: misto.id_indicador, nome: 'Misto' });
    expect(res.body[0].medicoes).toEqual([{ ano: ANO, semestre: 2, valor: 20 }]);
    semRascunho(res.body);
  });

  it('GET /api/indicadores sem filtro não traz o indicador que só tem rascunho', async () => {
    const res = await request(app).get('/api/indicadores');

    expect(res.status).toBe(200);
    const ids = res.body.map((item) => item.id);
    expect(ids).not.toContain(soRascunho.id_indicador);
    expect(ids).toContain(misto.id_indicador);
    semRascunho(res.body);
  });

  it.each([
    ['ano e semestre do rascunho', `ano=${ANO}&semestre=1`],
    ['ano e semestre do rascunho, no setor', `setor=SETOR&ano=${ANO}&semestre=1`],
  ])('GET /api/indicadores com %s responde []', async (_caso, consulta) => {
    const res = await request(app).get(`/api/indicadores?${consulta.replace('SETOR', setor.id_setor)}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('GET /api/indicadores/destaques usa só a publicada, sem variação contra o rascunho', async () => {
    const res = await request(app).get(`/api/indicadores/destaques?setor=${setor.id_setor}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({
      id: misto.id_indicador,
      valor: 20,
      periodo: { ano: ANO, semestre: 2 },
      variacao_percentual: null,
    });
    semRascunho(res.body);
  });

  it.each([
    ['ano', `ano=${ANO}`],
    ['ano e semestre do rascunho', `ano=${ANO}&semestre=1`],
  ])('GET /api/indicadores/destaques filtrado por %s não usa o rascunho', async (_caso, consulta) => {
    const res = await request(app).get(`/api/indicadores/destaques?setor=${setor.id_setor}&${consulta}`);

    expect(res.status).toBe(200);
    semRascunho(res.body);
    expect(res.body.map((item) => item.id)).not.toContain(soRascunho.id_indicador);
  });

  it('GET /api/relatorios não lista relatório em rascunho', async () => {
    const [todos, doAno] = await Promise.all([
      request(app).get('/api/relatorios'),
      request(app).get(`/api/relatorios?ano=${ANO}`),
    ]);

    expect(todos.status).toBe(200);
    expect(todos.body.map((item) => item.id)).not.toContain(relatorio.id_relatorio);
    expect(doAno.body).toEqual([]);
    semRascunho(todos.body);
  });

  it('GET /api/setores não expõe nada de medição', async () => {
    const res = await request(app).get('/api/setores');

    expect(res.status).toBe(200);
    expect(res.body).toContainEqual({ id: setor.id_setor, nome: setor.nome });
    semRascunho(res.body);
  });
});
