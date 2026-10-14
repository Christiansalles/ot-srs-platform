import { vi } from 'vitest';
import { getSetores, getPeriodos, getIndicadores, getDestaques } from '../services/api';
import { mockIndicadores } from '../mocks/dados';

describe('serviços da API', () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

  it('adiciona /api às rotas e mantém o filtro de setor', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false');
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    vi.stubGlobal('fetch', fetchMock);
    await getSetores();
    await getPeriodos();
    await getIndicadores({ setor: 1 });
    await getDestaques();
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      'http://localhost:3000/api/setores',
      'http://localhost:3000/api/periodos',
      'http://localhost:3000/api/indicadores?setor=1',
      'http://localhost:3000/api/indicadores/destaques',
    ]);
  });

  it('não chama a API quando o mock está explicitamente ligado', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'true');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const data = await getIndicadores({ setor: 1 });
    expect(data.every((item) => item.setor.id === 1)).toBe(true);
    expect(data.find((item) => item.nome === 'Número de leitos').medicoes.map((item) => item.valor)).toEqual([280, 312, 350]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('propaga respostas HTTP de erro sem substituí-las por mocks', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    await expect(getSetores()).rejects.toThrow('HTTP 404');
  });

  it('envia apenas filtros preenchidos nas duas rotas', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false');
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    vi.stubGlobal('fetch', fetchMock);
    await getIndicadores({ setor: 2, ano: 2024, semestre: 2 });
    await getDestaques({ setor: '', ano: 2024, semestre: undefined });
    await getIndicadores({ setor: null, ano: undefined, semestre: '' });
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      'http://localhost:3000/api/indicadores?setor=2&ano=2024&semestre=2',
      'http://localhost:3000/api/indicadores/destaques?ano=2024',
      'http://localhost:3000/api/indicadores',
    ]);
  });

  it('disponibiliza a carga nova e o histórico de empresas e empregos', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'true');
    expect(await getSetores()).toHaveLength(6);
    expect((await getPeriodos()).map((item) => item.ano)).toEqual([2020, 2021, 2022, 2023, 2024, 2025]);
    const indicadores = await getIndicadores();
    expect(indicadores).toHaveLength(12);
    expect(indicadores.flatMap((item) => item.medicoes)).toHaveLength(23);
    const destaques = await getDestaques({ setor: 2, ano: 2025 });
    expect(destaques.find((item) => item.nome === 'Número de empresas')).toMatchObject({ valor: 120, variacao_percentual: 15.4 });
    expect(destaques.find((item) => item.nome === 'Empregos no setor')).toMatchObject({ valor: 840, variacao_percentual: 10.5 });
    expect(destaques.find((item) => item.nome === 'Fluxo de visitantes')).toMatchObject({ valor: 5200, variacao_percentual: 18.2 });
  });

  it('combina setor e período e calcula a variação contra a medição fora do filtro', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'true');
    const indicadores = await getIndicadores({ setor: '1', ano: '2024', semestre: '2' });
    expect(indicadores).toHaveLength(1);
    expect(indicadores[0]).toMatchObject({ nome: 'Número de leitos', medicoes: [{ ano: 2024, semestre: 2, valor: 312 }] });
    expect(await getDestaques({ setor: 1, ano: 2024 })).toEqual([
      { id: 1, nome: 'Número de leitos', unidade: 'leitos', valor: 312,
        periodo: { ano: 2024, semestre: 2 }, variacao_percentual: 11.4 },
    ]);
  });

  it('retorna vazio para filtros válidos sem dados', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'true');
    for (const filtros of [{ ano: 2019 }, { setor: 999 }, { ano: 2025, semestre: 1 }]) {
      expect(await getIndicadores(filtros)).toEqual([]);
      expect(await getDestaques(filtros)).toEqual([]);
    }
  });

  it.each([
    [{ setor: 'abc' }, 'setor deve ser um número inteiro positivo'],
    [{ setor: 0 }, 'setor deve ser um número inteiro positivo'],
    [{ ano: 25 }, 'ano deve ser um número inteiro de 4 dígitos'],
    [{ ano: 'abc' }, 'ano deve ser um número inteiro de 4 dígitos'],
    [{ ano: 2025, semestre: 3 }, 'semestre deve ser 1 ou 2'],
    [{ semestre: 2 }, 'semestre exige ano'],
  ])('rejeita filtros inválidos no mock: %j', async (filtros, mensagem) => {
    vi.stubEnv('VITE_USE_MOCK', 'true');
    await expect(getIndicadores(filtros)).rejects.toThrow(mensagem);
    await expect(getDestaques(filtros)).rejects.toThrow(mensagem);
  });

  it('usa ambos os semestres no ano e o mais recente no destaque', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'true');
    const indicador = mockIndicadores.find((item) => item.nome === 'Taxa de ocupação');
    indicador.medicoes.unshift({ ano: 2025, semestre: 1, valor: 60 });
    try {
      const dados = await getIndicadores({ setor: 1, ano: 2025 });
      expect(dados.find((item) => item.id === indicador.id).medicoes).toHaveLength(2);
      const destaques = await getDestaques({ setor: 1, ano: 2025 });
      expect(destaques.find((item) => item.id === indicador.id)).toMatchObject({
        valor: 68, periodo: { ano: 2025, semestre: 2 }, variacao_percentual: 13.3,
      });
    } finally {
      indicador.medicoes.shift();
    }
  });

  it('devolve cópias dos mocks e mantém variação nula sem anterior ou com anterior zero', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'true');
    const dados = await getIndicadores({ setor: 1 });
    dados.find((item) => item.id === 1).medicoes[0].valor = 0;
    expect((await getIndicadores({ setor: 1 }))[0].medicoes[0].valor).toBe(280);
    expect((await getDestaques({ setor: 1, ano: 2023 }))[0].variacao_percentual).toBeNull();
    const indicador = mockIndicadores.find((item) => item.id === 1);
    const anterior = indicador.medicoes[1].valor;
    indicador.medicoes[1].valor = 0;
    try {
      expect((await getDestaques({ setor: 1, ano: 2025 }))[0].variacao_percentual).toBeNull();
    } finally {
      indicador.medicoes[1].valor = anterior;
    }
  });
});
