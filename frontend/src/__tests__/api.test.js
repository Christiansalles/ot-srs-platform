import { vi } from 'vitest';
import { getSetores, getPeriodos, getIndicadores, getDestaques } from '../services/api';

describe('serviços da API', () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

  it('adiciona /api às rotas e mantém o filtro de setor', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false');
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    vi.stubGlobal('fetch', fetchMock);
    await getSetores();
    await getPeriodos();
    await getIndicadores(1);
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
    const data = await getIndicadores(1);
    expect(data.every((item) => item.setor.id === 1)).toBe(true);
    expect(data[0].medicoes.map((item) => item.valor)).toEqual([280, 312, 350]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('propaga respostas HTTP de erro sem substituí-las por mocks', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    await expect(getSetores()).rejects.toThrow('HTTP 404');
  });
});
