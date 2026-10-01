// Teste de integração: precisa de um Postgres com as migrações aplicadas
// (no CI, o job backend roda `prisma migrate deploy` antes dos testes).

const prisma = require('../src/db');
const dados = require('../src/services/dados');

const sufixo = `dados-${Date.now()}`;
const ANO_TESTE = 2098; // fora do seed e do database.test.js (2099)

let usuario;
let hospedagem;
let gastronomia;
let leitos;
let restaurantes;
let periodo1;
let periodo2;

beforeAll(async () => {
  usuario = await prisma.usuario.create({
    data: { nome: 'Teste dados', email: `${sufixo}@teste.com`, senha_hash: 'x', ativo: false },
  });
  hospedagem = await prisma.setor.create({ data: { nome: `Hospedagem ${sufixo}` } });
  gastronomia = await prisma.setor.create({ data: { nome: `Gastronomia ${sufixo}` } });
  leitos = await prisma.indicador.create({
    data: { id_setor: hospedagem.id_setor, nome: 'Número de leitos', unidade: 'leitos' },
  });
  restaurantes = await prisma.indicador.create({
    data: { id_setor: gastronomia.id_setor, nome: 'Restaurantes', unidade: 'estabelecimentos' },
  });
  periodo1 = await prisma.periodo.upsert({
    where: { ano_semestre: { ano: ANO_TESTE, semestre: 1 } },
    update: {},
    create: { ano: ANO_TESTE, semestre: 1 },
  });
  periodo2 = await prisma.periodo.upsert({
    where: { ano_semestre: { ano: ANO_TESTE, semestre: 2 } },
    update: {},
    create: { ano: ANO_TESTE, semestre: 2 },
  });

  const medicao = (indicador, periodo, valor, status) => ({
    id_indicador: indicador.id_indicador,
    id_periodo: periodo.id_periodo,
    id_usuario: usuario.id_usuario,
    valor,
    status,
  });
  await prisma.medicao.createMany({
    data: [
      medicao(leitos, periodo1, 312, 'publicado'),
      medicao(leitos, periodo2, 350, 'rascunho'),
      medicao(restaurantes, periodo1, 40, 'publicado'),
    ],
  });
});

afterAll(async () => {
  if (usuario) {
    await prisma.medicao.deleteMany({ where: { id_usuario: usuario.id_usuario } });
    await prisma.indicador.deleteMany({
      where: { id_indicador: { in: [leitos, restaurantes].filter(Boolean).map((i) => i.id_indicador) } },
    });
    await prisma.setor.deleteMany({
      where: { id_setor: { in: [hospedagem, gastronomia].filter(Boolean).map((s) => s.id_setor) } },
    });
    await prisma.periodo.deleteMany({ where: { ano: ANO_TESTE } });
    await prisma.usuario.delete({ where: { id_usuario: usuario.id_usuario } });
  }
  await prisma.$disconnect();
});

describe('services/dados', () => {
  it('buscarSetores devolve id e nome', async () => {
    const setores = await dados.buscarSetores();

    expect(setores).toContainEqual({ id: hospedagem.id_setor, nome: hospedagem.nome });
  });

  it('buscarPeriodos devolve id, ano e semestre', async () => {
    const periodos = await dados.buscarPeriodos();

    expect(periodos).toContainEqual({ id: periodo1.id_periodo, ano: ANO_TESTE, semestre: 1 });
  });

  it('buscarIndicadores filtra pelo setor e traz só medições publicadas', async () => {
    const indicadores = await dados.buscarIndicadores({ setorId: hospedagem.id_setor });

    expect(indicadores).toHaveLength(1);
    expect(indicadores[0]).toMatchObject({
      id: leitos.id_indicador,
      nome: 'Número de leitos',
      unidade: 'leitos',
      setor: { id: hospedagem.id_setor, nome: hospedagem.nome },
    });
    expect(indicadores[0].medicoes).toHaveLength(1);
    expect(indicadores[0].medicoes[0]).toMatchObject({
      ano: ANO_TESTE,
      semestre: 1,
      status: 'publicado',
    });
    expect(Number(indicadores[0].medicoes[0].valor)).toBe(312);
  });

  it('buscarIndicadores sem setor traz indicadores de todos os setores', async () => {
    const indicadores = await dados.buscarIndicadores();
    const ids = indicadores.map((i) => i.id);

    expect(ids).toEqual(expect.arrayContaining([leitos.id_indicador, restaurantes.id_indicador]));
  });

  it('setor que não existe devolve lista vazia', async () => {
    expect(await dados.buscarIndicadores({ setorId: 999999 })).toEqual([]);
  });
});
