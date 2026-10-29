// Teste de integração: GET /api/relatorios contra os relatórios ilustrativos
// do seed (prisma/dados/relatorios). Os dois têm a mesma data de publicação
// (2026-10-21) e edição de 2025, o que cobre o filtro pelo ano da publicação e
// o desempate por id. Como o banco pode ter outros relatórios, as respostas
// são filtradas pelos ids do seed.

const fs = require('fs');
const path = require('path');
const request = require('supertest');
const prisma = require('../src/db');
const app = require('../src/app');
const { executarSeed, limparUploads } = require('./helpers/seed');

const relatoriosDir = path.resolve(__dirname, '..', 'prisma', 'dados', 'relatorios');
const carga = JSON.parse(fs.readFileSync(path.join(relatoriosDir, 'relatorios.json'), 'utf8'));
const hoteleiro = carga.find(({ categoria }) => categoria === 'Setor Hoteleiro');
const impacto = carga.find(({ categoria }) => categoria === 'Impacto Econômico');

const ids = {};

beforeAll(async () => {
  executarSeed();

  const relatorios = await prisma.relatorio.findMany({
    where: { edicao: { in: carga.map(({ edicao }) => edicao) } },
    select: { id_relatorio: true, edicao: true },
  });
  for (const relatorio of relatorios) ids[relatorio.edicao] = relatorio.id_relatorio;
});

afterAll(async () => {
  await prisma.$disconnect();
  limparUploads();
});

const doSeed = (body) => body.filter((item) => Object.values(ids).includes(item.id));
const edicoes = (body) => doSeed(body).map((item) => item.edicao);

async function listar(query = {}) {
  const res = await request(app).get('/api/relatorios').query(query);
  expect(res.status).toBe(200);
  return res.body;
}

describe('GET /api/relatorios com os PDFs do seed', () => {
  it('lista os dois relatórios no formato público, com o tamanho real do PDF', async () => {
    const body = await listar();

    expect(Object.keys(ids)).toHaveLength(carga.length);
    for (const esperado of carga) {
      const id = ids[esperado.edicao];
      const bytes = fs.statSync(path.join(relatoriosDir, esperado.arquivo)).size;
      expect(body.find((item) => item.id === id)).toEqual({
        id,
        titulo: esperado.titulo,
        edicao: esperado.edicao,
        categoria: esperado.categoria,
        data_publicacao: esperado.data_publicacao,
        descricao: esperado.descricao,
        tamanho_kb: Math.ceil(bytes / 1024),
        url_arquivo: `/api/relatorios/${id}/arquivo`,
      });
    }
  });

  it('desempata a mesma data pelo cadastrado por último', async () => {
    const body = await listar();

    const idsDoSeed = doSeed(body).map((item) => item.id);
    expect(idsDoSeed).toEqual([...idsDoSeed].sort((a, b) => b - a));
  });

  it('filtra pelo ano da publicação, não pelo ano da edição', async () => {
    expect(edicoes(await listar({ ano: '2026' })).sort()).toEqual(carga.map(({ edicao }) => edicao).sort());
    expect(edicoes(await listar({ ano: '2025' }))).toEqual([]);
  });

  it.each([
    ['Setor Hoteleiro', hoteleiro],
    ['Impacto Econômico', impacto],
  ])('filtra pela categoria %s', async (categoria, esperado) => {
    expect(edicoes(await listar({ categoria }))).toEqual([esperado.edicao]);
    expect(edicoes(await listar({ ano: '2026', categoria }))).toEqual([esperado.edicao]);
  });

  it.each([
    [{ categoria: 'Perfil de Demanda' }],
    [{ categoria: 'Diagnóstico Estratégico' }],
    [{ ano: '2025', categoria: 'Setor Hoteleiro' }],
  ])('não traz relatório do seed para %o', async (query) => {
    expect(edicoes(await listar(query))).toEqual([]);
  });
});
