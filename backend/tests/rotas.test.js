const request = require('supertest');

jest.mock('../src/services/dados');

const dados = require('../src/services/dados');
const app = require('../src/app');
const fixtures = require('./fixtures/dados');

beforeEach(() => {
  jest.clearAllMocks();
  dados.buscarSetores.mockResolvedValue(fixtures.setores);
  dados.buscarPeriodos.mockResolvedValue(fixtures.periodos);
  dados.buscarIndicadores.mockImplementation(async ({ setorId } = {}) =>
    fixtures.indicadores.filter((i) => setorId === undefined || i.setor.id === setorId),
  );
});

describe('GET /api/setores', () => {
  it('responde 200 com os setores em ordem alfabética', async () => {
    const res = await request(app).get('/api/setores');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { id: 2, nome: 'Gastronomia' },
      { id: 1, nome: 'Hospedagem' },
    ]);
  });
});

describe('GET /api/periodos', () => {
  it('responde 200 com os períodos em ordem cronológica', async () => {
    const res = await request(app).get('/api/periodos');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { id: 1, ano: 2023, semestre: 2 },
      { id: 2, ano: 2024, semestre: 2 },
      { id: 3, ano: 2025, semestre: 1 },
      { id: 4, ano: 2025, semestre: 2 },
    ]);
  });
});

describe('GET /api/indicadores', () => {
  it('responde 200 no formato do contrato, filtrando pelo setor', async () => {
    const res = await request(app).get('/api/indicadores?setor=1');

    expect(res.status).toBe(200);
    expect(dados.buscarIndicadores).toHaveBeenCalledWith({ setorId: 1 });
    expect(res.body).toEqual([
      {
        id: 1,
        nome: 'Número de leitos',
        unidade: 'leitos',
        setor: { id: 1, nome: 'Hospedagem' },
        medicoes: [
          { ano: 2023, semestre: 2, valor: 280 },
          { ano: 2024, semestre: 2, valor: 312 },
          { ano: 2025, semestre: 2, valor: 350 },
        ],
      },
      {
        id: 2,
        nome: 'Taxa de ocupação',
        unidade: '%',
        setor: { id: 1, nome: 'Hospedagem' },
        medicoes: [{ ano: 2025, semestre: 2, valor: 68 }],
      },
    ]);
  });

  it('sem setor, devolve os indicadores de todos os setores', async () => {
    const res = await request(app).get('/api/indicadores');

    expect(res.status).toBe(200);
    expect(dados.buscarIndicadores).toHaveBeenCalledWith({ setorId: undefined });
    expect(res.body.map((i) => i.nome)).toEqual([
      'Número de leitos',
      'Restaurantes',
      'Taxa de ocupação',
    ]);
  });

  it('não mostra medição em rascunho', async () => {
    const res = await request(app).get('/api/indicadores?setor=1');
    const leitos = res.body.find((i) => i.nome === 'Número de leitos');

    expect(leitos.medicoes).not.toContainEqual(expect.objectContaining({ ano: 2026 }));
  });

  it('deixa de fora indicador sem nenhuma medição publicada', async () => {
    const res = await request(app).get('/api/indicadores?setor=1');

    expect(res.body.map((i) => i.nome)).not.toContain('Diária média');
  });

  it('setor que não existe devolve 200 com lista vazia', async () => {
    const res = await request(app).get('/api/indicadores?setor=999');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it.each(['abc', '1.5', '-1', '0', ''])('setor inválido (%p) devolve 400 com erro', async (setor) => {
    const res = await request(app).get(`/api/indicadores?setor=${setor}`);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ erro: 'setor deve ser um número inteiro positivo' });
    expect(dados.buscarIndicadores).not.toHaveBeenCalled();
  });

  it('setor repetido na URL devolve 400', async () => {
    const res = await request(app).get('/api/indicadores?setor=1&setor=2');

    expect(res.status).toBe(400);
  });
});

describe('GET /api/indicadores/destaques', () => {
  it('responde 200 com um destaque por indicador publicado, em ordem alfabética', async () => {
    const res = await request(app).get('/api/indicadores/destaques');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      {
        id: 1,
        nome: 'Número de leitos',
        unidade: 'leitos',
        valor: 350,
        periodo: { ano: 2025, semestre: 2 },
        variacao_percentual: 12.2,
      },
      {
        id: 4,
        nome: 'Restaurantes',
        unidade: 'estabelecimentos',
        valor: 40,
        periodo: { ano: 2025, semestre: 2 },
        variacao_percentual: null,
      },
      {
        id: 2,
        nome: 'Taxa de ocupação',
        unidade: '%',
        valor: 68,
        periodo: { ano: 2025, semestre: 2 },
        variacao_percentual: null,
      },
    ]);
  });
});
