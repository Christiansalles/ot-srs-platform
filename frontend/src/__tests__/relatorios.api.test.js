import { readFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { baixarRelatorio, getRelatorios, urlDownloadRelatorio } from '../services/api';
import { mockRelatorios } from '../mocks/relatorios';
import { AUTH_UNAUTHORIZED_EVENT } from '../services/auth';

afterEach(() => {
  window.sessionStorage.clear();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('serviços de relatórios', () => {
  it('consulta a rota pública com filtros opcionais e codifica a categoria', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false');
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    vi.stubGlobal('fetch', fetchMock);

    await getRelatorios();
    await getRelatorios({ ano: 2026, categoria: 'Impacto Econômico' });
    await getRelatorios({ ano: '2026', categoria: '' });
    await getRelatorios({ ano: undefined, categoria: 'Setor Hoteleiro' });
    await getRelatorios({ ano: null, categoria: undefined, setor: 1, semestre: 2 });

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      'http://localhost:3000/api/relatorios',
      'http://localhost:3000/api/relatorios?ano=2026&categoria=Impacto+Econ%C3%B4mico',
      'http://localhost:3000/api/relatorios?ano=2026',
      'http://localhost:3000/api/relatorios?categoria=Setor+Hoteleiro',
      'http://localhost:3000/api/relatorios',
    ]);
  });

  it('devolve os relatórios da API sem substituir os IDs pelos do mock', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false');
    const dados = [{ ...mockRelatorios[0], id: 42, url_arquivo: '/api/relatorios/42/arquivo' }];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => dados }));
    await expect(getRelatorios()).resolves.toEqual(dados);
  });

  it('monta a URL do download usando a base configurada, sem duplicar /api', async () => {
    expect(urlDownloadRelatorio(2)).toBe('http://localhost:3000/api/relatorios/2/arquivo');
    vi.stubEnv('VITE_API_URL', 'https://api.exemplo.com/');
    vi.resetModules();
    const api = await import('../services/api');
    expect(api.urlDownloadRelatorio(42)).toBe('https://api.exemplo.com/api/relatorios/42/arquivo');
    vi.stubEnv('VITE_USE_MOCK', 'false');
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    vi.stubGlobal('fetch', fetchMock);
    await api.getRelatorios();
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.exemplo.com/api/relatorios');
  });

  it('preserva a mensagem de erro da API sem ativar o mock', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, status: 400, json: async () => ({ erro: 'Categoria inválida' }),
    }));
    await expect(getRelatorios({ categoria: 'Outra' })).rejects.toThrow('Categoria inválida');
  });

  it('mantém o envio do token e encerra a sessão ao receber 401', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false');
    window.sessionStorage.setItem('ot-srs-token', 'jwt-de-teste');
    window.sessionStorage.setItem('ot-srs-user', JSON.stringify({ id: 1 }));
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false, status: 401, json: async () => ({ erro: 'Token inválido ou expirado' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const aoExpirar = vi.fn();
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, aoExpirar);
    try {
      await expect(getRelatorios()).rejects.toThrow('Token inválido ou expirado');
      expect(fetchMock).toHaveBeenCalledWith('http://localhost:3000/api/relatorios', {
        headers: { Authorization: 'Bearer jwt-de-teste' },
      });
      expect(window.sessionStorage.getItem('ot-srs-token')).toBeNull();
      expect(window.sessionStorage.getItem('ot-srs-user')).toBeNull();
      expect(aoExpirar).toHaveBeenCalledOnce();
    } finally {
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, aoExpirar);
    }
  });

  it.each([
    ['erro de rede', () => Promise.reject(new TypeError('Failed to fetch'))],
    ['erro HTTP sem JSON', () => Promise.resolve({ ok: false, status: 500, json: async () => { throw new SyntaxError(); } })],
    ['erro HTTP sem mensagem', () => Promise.resolve({ ok: false, status: 500, json: async () => ({}) })],
    ['resposta inválida', () => Promise.resolve({ ok: true, json: async () => { throw new SyntaxError(); } })],
  ])('transforma %s em mensagem em português', async (_, resposta) => {
    vi.stubEnv('VITE_USE_MOCK', 'false');
    vi.stubGlobal('fetch', vi.fn().mockImplementation(resposta));
    await expect(getRelatorios()).rejects.toThrow('Não foi possível consultar os relatórios. Tente novamente.');
  });
});

describe('download de relatórios', () => {
  it('busca o PDF na rota pública mesmo com a listagem em modo mock', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'true');
    const arquivo = new Blob(['%PDF-1.4'], { type: 'application/pdf' });
    const json = vi.fn();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, blob: async () => arquivo, json });
    vi.stubGlobal('fetch', fetchMock);
    await expect(baixarRelatorio(2)).resolves.toBe(arquivo);
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3000/api/relatorios/2/arquivo', { headers: {} });
    expect(json).not.toHaveBeenCalled();
  });

  it('propaga a mensagem de 404 sem devolver um arquivo', async () => {
    const blob = vi.fn();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, status: 404, json: async () => ({ erro: 'Relatório não encontrado' }), blob,
    }));
    await expect(baixarRelatorio(999)).rejects.toThrow('Relatório não encontrado');
    expect(blob).not.toHaveBeenCalled();
  });

  it.each([
    ['falha de rede', () => Promise.reject(new TypeError('Failed to fetch'))],
    ['erro sem JSON', () => Promise.resolve({ ok: false, status: 503, json: async () => { throw new SyntaxError(); } })],
    ['falha ao ler o arquivo', () => Promise.resolve({ ok: true, blob: async () => { throw new TypeError(); } })],
  ])('apresenta mensagem em português para %s', async (_, resposta) => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(resposta));
    await expect(baixarRelatorio(1)).rejects.toThrow('Não foi possível baixar o relatório. Tente novamente.');
  });
});

describe('mocks de relatórios', () => {
  // Os dois têm a mesma data; a API devolve o de maior id primeiro.
  const naOrdemDaApi = [mockRelatorios[1], mockRelatorios[0]];

  it('acompanha todos os metadados da carga, os IDs em banco vazio e os tamanhos dos PDFs', () => {
    const pasta = resolve(dirname(fileURLToPath(import.meta.url)), '../../../backend/prisma/dados/relatorios');
    const carga = JSON.parse(readFileSync(resolve(pasta, 'relatorios.json'), 'utf8'));
    expect(mockRelatorios).toEqual(carga.map((relatorio, indice) => ({
      id: indice + 1,
      titulo: relatorio.titulo,
      edicao: relatorio.edicao,
      categoria: relatorio.categoria,
      data_publicacao: relatorio.data_publicacao,
      descricao: relatorio.descricao,
      tamanho_kb: Math.ceil(statSync(resolve(pasta, relatorio.arquivo)).size / 1024),
      url_arquivo: `/api/relatorios/${indice + 1}/arquivo`,
    })));
  });

  it('usa mock somente quando explícito e devolve cópias dos dados', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'true');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const dados = await getRelatorios();
    expect(dados).toEqual(naOrdemDaApi);
    dados[0].titulo = 'Título alterado';
    expect((await getRelatorios())[0].titulo).toBe('Participação econômica do turismo');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('filtra pelo ano de publicação, combina categoria e aceita filtros vazios', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'true');
    expect(await getRelatorios({ ano: 2026 })).toEqual(naOrdemDaApi);
    expect(await getRelatorios({ ano: 2025 })).toEqual([]);
    expect(await getRelatorios({ ano: '2026', categoria: 'Impacto Econômico' })).toEqual([mockRelatorios[1]]);
    expect(await getRelatorios({ categoria: 'Setor Hoteleiro' })).toEqual([mockRelatorios[0]]);
    expect(await getRelatorios({ ano: '', categoria: null })).toEqual(naOrdemDaApi);
    expect(await getRelatorios({ categoria: 'Perfil de Demanda' })).toEqual([]);
    expect(await getRelatorios({ categoria: 'Diagnóstico Estratégico' })).toEqual([]);
  });

  it('ordena os relatórios pela publicação mais recente', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'true');
    const data = mockRelatorios[0].data_publicacao;
    mockRelatorios[0].data_publicacao = '2026-10-22';
    try {
      expect((await getRelatorios()).map((relatorio) => relatorio.id)).toEqual([1, 2]);
    } finally {
      mockRelatorios[0].data_publicacao = data;
    }
  });

  it('desempata a mesma data pelo maior id, como a API', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'true');
    expect((await getRelatorios()).map((relatorio) => relatorio.id)).toEqual([2, 1]);
  });

  it.each([
    [{ ano: 26 }, 'ano deve ser um número inteiro de 4 dígitos'],
    [{ ano: 'abc' }, 'ano deve ser um número inteiro de 4 dígitos'],
    [{ ano: 20266 }, 'ano deve ser um número inteiro de 4 dígitos'],
    [{ categoria: 'Outra' }, 'Categoria inválida'],
    [{ categoria: 'setor hoteleiro' }, 'Categoria inválida'],
  ])('rejeita filtros inválidos como a API: %j', async (filtros, mensagem) => {
    vi.stubEnv('VITE_USE_MOCK', 'true');
    await expect(getRelatorios(filtros)).rejects.toThrow(mensagem);
  });
});
