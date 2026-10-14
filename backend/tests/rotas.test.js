const request = require('supertest');

jest.mock('../src/services/dados');

const dados = require('../src/services/dados');
const app = require('../src/app');
const fixtures = require('./fixtures/dados');

// Mesma regra de services/dados.js: com `ano`, as candidatas a "anterior" do
// destaque são as medições publicadas até o fim do ano (só `ano`) ou antes do
// semestre escolhido (`ano` e `semestre`), mesmo fora do filtro.
function candidatasAnteriores(medicoes, ano, semestre) {
  if (ano === undefined) return [];
  return medicoes.filter((m) => m.status === 'publicado' && (semestre === undefined
    ? m.ano <= ano
    : m.ano < ano || (m.ano === ano && m.semestre < semestre)));
}

beforeEach(() => {
  jest.clearAllMocks();
  dados.buscarSetores.mockResolvedValue(fixtures.setores);
  dados.buscarPeriodos.mockResolvedValue(fixtures.periodos);
  dados.buscarIndicadores.mockImplementation(async ({ setorId, ano, semestre } = {}) =>
    fixtures.indicadores
      .filter((i) => setorId === undefined || i.setor.id === setorId)
      .map((i) => ({
        ...i,
        medicoes: i.medicoes.filter((m) =>
          (ano === undefined || m.ano === ano) && (semestre === undefined || m.semestre === semestre)),
        medicoesCandidatasAnteriores: candidatasAnteriores(i.medicoes, ano, semestre),
      }))
      .filter((i) => i.medicoes.length > 0),
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
    expect(dados.buscarIndicadores).toHaveBeenCalledWith({ setorId: 1, ano: undefined, semestre: undefined });
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
    expect(dados.buscarIndicadores).toHaveBeenCalledWith({ setorId: undefined, ano: undefined, semestre: undefined });
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

  it('filtra no serviço pelo ano e semestre informados', async () => {
    const res = await request(app).get('/api/indicadores?setor=1&ano=2025&semestre=2');

    expect(res.status).toBe(200);
    expect(dados.buscarIndicadores).toHaveBeenCalledWith({ setorId: 1, ano: 2025, semestre: 2 });
    expect(res.body.every((i) => i.medicoes.every((m) => m.ano === 2025 && m.semestre === 2))).toBe(true);
  });

  it.each(['25', '202', '20255', 'abc', '1.5'])('ano inválido (%p) devolve 400', async (ano) => {
    const res = await request(app).get(`/api/indicadores?ano=${ano}`);
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ erro: 'ano deve ser um número inteiro de 4 dígitos' });
  });

  it.each(['0', '3', 'abc'])('semestre inválido (%p) devolve 400', async (semestre) => {
    const res = await request(app).get(`/api/indicadores?ano=2025&semestre=${semestre}`);
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ erro: 'semestre deve ser 1 ou 2' });
  });

  it('semestre sem ano devolve 400', async () => {
    const res = await request(app).get('/api/indicadores?semestre=2');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ erro: 'semestre exige ano' });
  });

  it('ano e semestre sem setor devolvem só as medições daquele período', async () => {
    const res = await request(app).get('/api/indicadores?ano=2025&semestre=2');

    expect(res.status).toBe(200);
    expect(dados.buscarIndicadores).toHaveBeenCalledWith({ setorId: undefined, ano: 2025, semestre: 2 });
    expect(res.body).toEqual([
      {
        id: 1,
        nome: 'Número de leitos',
        unidade: 'leitos',
        setor: { id: 1, nome: 'Hospedagem' },
        medicoes: [{ ano: 2025, semestre: 2, valor: 350 }],
      },
      {
        id: 4,
        nome: 'Restaurantes',
        unidade: 'estabelecimentos',
        setor: { id: 2, nome: 'Gastronomia' },
        medicoes: [{ ano: 2025, semestre: 2, valor: 40 }],
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

  it('ano sem semestre funciona e traz só medições daquele ano', async () => {
    const res = await request(app).get('/api/indicadores?ano=2025');

    expect(res.status).toBe(200);
    expect(dados.buscarIndicadores).toHaveBeenCalledWith({ setorId: undefined, ano: 2025, semestre: undefined });
    expect(res.body.map((i) => i.nome)).toEqual(['Número de leitos', 'Restaurantes', 'Taxa de ocupação']);
    expect(res.body.every((i) => i.medicoes.every((m) => m.ano === 2025))).toBe(true);
  });

  it('setor e ano combinam os dois filtros', async () => {
    const res = await request(app).get('/api/indicadores?setor=1&ano=2024');

    expect(res.status).toBe(200);
    expect(dados.buscarIndicadores).toHaveBeenCalledWith({ setorId: 1, ano: 2024, semestre: undefined });
    expect(res.body).toEqual([
      {
        id: 1,
        nome: 'Número de leitos',
        unidade: 'leitos',
        setor: { id: 1, nome: 'Hospedagem' },
        medicoes: [{ ano: 2024, semestre: 2, valor: 312 }],
      },
    ]);
  });

  it('período válido sem dado devolve 200 com lista vazia', async () => {
    const res = await request(app).get('/api/indicadores?ano=2019');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('sem filtro, a resposta continua igual à do M4', async () => {
    const res = await request(app).get('/api/indicadores');

    expect(res.status).toBe(200);
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
        id: 4,
        nome: 'Restaurantes',
        unidade: 'estabelecimentos',
        setor: { id: 2, nome: 'Gastronomia' },
        medicoes: [{ ano: 2025, semestre: 2, valor: 40 }],
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

  it('com ano antigo, a variação usa a medição anterior que ficou fora do filtro', async () => {
    const res = await request(app).get('/api/indicadores/destaques?ano=2024');

    expect(res.status).toBe(200);
    expect(dados.buscarIndicadores).toHaveBeenCalledWith({ setorId: undefined, ano: 2024, semestre: undefined });
    // 312 em 2024/2 contra 280 em 2023/2; ocupação e restaurantes não têm 2024.
    expect(res.body).toEqual([
      {
        id: 1,
        nome: 'Número de leitos',
        unidade: 'leitos',
        valor: 312,
        periodo: { ano: 2024, semestre: 2 },
        variacao_percentual: 11.4,
      },
    ]);
  });

  it('setor, ano e semestre juntos trazem o destaque daquele período', async () => {
    const res = await request(app).get('/api/indicadores/destaques?setor=1&ano=2025&semestre=2');

    expect(res.status).toBe(200);
    expect(dados.buscarIndicadores).toHaveBeenCalledWith({ setorId: 1, ano: 2025, semestre: 2 });
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
        id: 2,
        nome: 'Taxa de ocupação',
        unidade: '%',
        valor: 68,
        periodo: { ano: 2025, semestre: 2 },
        variacao_percentual: null,
      },
    ]);
  });

  it('período válido sem dado devolve 200 com lista vazia', async () => {
    const res = await request(app).get('/api/indicadores/destaques?ano=2019');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it.each([
    ['ano=abc', 'ano deve ser um número inteiro de 4 dígitos'],
    ['ano=25', 'ano deve ser um número inteiro de 4 dígitos'],
    ['ano=2025&semestre=3', 'semestre deve ser 1 ou 2'],
    ['ano=2025&semestre=0', 'semestre deve ser 1 ou 2'],
    ['semestre=2', 'semestre exige ano'],
    ['setor=abc', 'setor deve ser um número inteiro positivo'],
  ])('filtro inválido (%s) devolve 400 sem consultar o banco', async (query, erro) => {
    const res = await request(app).get(`/api/indicadores/destaques?${query}`);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ erro });
    expect(dados.buscarIndicadores).not.toHaveBeenCalled();
  });
});
