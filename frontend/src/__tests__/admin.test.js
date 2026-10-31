import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  alterarStatusMedicao,
  alterarStatusRelatorio,
  criarMedicao,
  criarIndicador,
  editarIndicador,
  editarMedicao,
  enviarRelatorio,
  listarIndicadoresAdmin,
  listarRelatoriosAdmin,
  resetarMocksAdmin,
} from '../services/admin';
import { AUTH_UNAUTHORIZED_EVENT } from '../services/auth';

function resposta(status, dados) {
  return { ok: status >= 200 && status < 300, status, json: async () => dados };
}

describe('serviço administrativo', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    window.sessionStorage.clear();
    resetarMocksAdmin();
  });

  it('envia o token e os filtros ao listar indicadores do painel', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false');
    window.sessionStorage.setItem('ot-srs-token', 'jwt-do-painel');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(resposta(200, [])));

    await listarIndicadoresAdmin({ setor: 1, status: 'rascunho' });

    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/admin/indicadores?setor=1&status=rascunho', {
      method: 'GET',
      headers: { Authorization: 'Bearer jwt-do-painel' },
      body: undefined,
    });
  });

  it.each([
    ['medições', alterarStatusMedicao, 'medicoes'],
    ['relatórios', alterarStatusRelatorio, 'relatorios'],
  ])('envia o PATCH de status de %s com o token', async (_nome, alterarStatus, rota) => {
    vi.stubEnv('VITE_USE_MOCK', 'false');
    window.sessionStorage.setItem('ot-srs-token', 'jwt-do-painel');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(resposta(200, { id: 7, status: 'publicado' })));

    await expect(alterarStatus(7, 'publicado')).resolves.toEqual({ id: 7, status: 'publicado' });

    expect(fetch).toHaveBeenCalledWith(`http://localhost:3000/api/admin/${rota}/7/status`, {
      method: 'PATCH',
      headers: { Authorization: 'Bearer jwt-do-painel', 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'publicado' }),
    });
  });

  it('limpa a sessão e dispara AUTH_UNAUTHORIZED_EVENT ao receber 401', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false');
    window.sessionStorage.setItem('ot-srs-token', 'jwt-expirado');
    window.sessionStorage.setItem('ot-srs-user', JSON.stringify({ id: 1, nome: 'Admin' }));
    const evento = vi.fn();
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, evento);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(resposta(401, { erro: 'Token inválido ou expirado' })));

    await expect(listarIndicadoresAdmin()).rejects.toMatchObject({
      status: 401,
      message: 'Token inválido ou expirado',
    });

    expect(evento).toHaveBeenCalledOnce();
    expect(window.sessionStorage.getItem('ot-srs-token')).toBeNull();
    expect(window.sessionStorage.getItem('ot-srs-user')).toBeNull();
    window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, evento);
  });

  it('propaga a mensagem legível da API para conflito 409', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(resposta(409, {
      erro: 'Já existe uma medição deste indicador em 2025/2',
    })));

    await expect(criarMedicao({ id_indicador: 1, ano: 2025, semestre: 2, valor: 350 }))
      .rejects.toMatchObject({ status: 409, message: 'Já existe uma medição deste indicador em 2025/2' });
  });

  it('mostra mensagem legível para arquivo acima do limite (413)', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false');
    const formData = new FormData();
    formData.append('titulo', 'Relatório');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(resposta(413, { erro: 'Arquivo muito grande' })));

    await expect(enviarRelatorio(formData)).rejects.toMatchObject({
      status: 413,
      message: 'Arquivo muito grande',
    });
    expect(fetch.mock.calls[0][0]).toBe('http://localhost:3000/api/admin/relatorios');
    expect(fetch.mock.calls[0][1].body).toBe(formData);
    expect(fetch.mock.calls[0][1].headers).not.toHaveProperty('Content-Type');
  });

  it.each([
    [400, 'Confira os dados informados e tente novamente.'],
    [403, 'Seu perfil não tem permissão para realizar esta ação.'],
    [409, 'Há um conflito com os dados atuais. Confira se a medição já existe ou está publicada.'],
    [413, 'O arquivo excede o limite permitido de 10 MiB.'],
  ])('usa mensagem padrão clara para status %s sem corpo legível', async (status, mensagem) => {
    vi.stubEnv('VITE_USE_MOCK', 'false');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status,
      json: async () => { throw new Error('Resposta sem JSON'); },
    }));

    await expect(criarIndicador({ nome: 'Leitos' })).rejects.toMatchObject({ status, message: mensagem });
  });

  it('envia multipart e Bearer nos uploads de relatório', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false');
    window.sessionStorage.setItem('ot-srs-token', 'jwt-upload');
    const formData = new FormData();
    formData.append('titulo', 'Relatório');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(resposta(201, { id: 1, status: 'rascunho' })));

    await enviarRelatorio(formData);

    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/admin/relatorios', {
      method: 'POST',
      headers: { Authorization: 'Bearer jwt-upload' },
      body: formData,
    });
  });

  it('usa os ids do seed e inclui medições em rascunho nos mocks do painel', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'true');

    const indicadores = await listarIndicadoresAdmin();
    const idsIndicadores = indicadores.map((indicador) => indicador.id).sort((a, b) => a - b);
    const idsMedicoes = indicadores.flatMap((indicador) => indicador.medicoes.map((medicao) => medicao.id))
      .sort((a, b) => a - b);

    expect(idsIndicadores).toEqual(Array.from({ length: 12 }, (_, indice) => indice + 1));
    expect(idsMedicoes).toEqual(Array.from({ length: 23 }, (_, indice) => indice + 1));
    expect(indicadores.flatMap((indicador) => indicador.medicoes).some((medicao) => medicao.status === 'rascunho')).toBe(true);
    expect((await listarRelatoriosAdmin()).map((relatorio) => relatorio.id)).toEqual([1, 2]);
  });

  it('faz operações de edição/status em modo mock sem expor referências mutáveis', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'true');
    const indicadorOriginal = (await listarIndicadoresAdmin())
      .find((indicador) => indicador.medicoes.some((medicao) => medicao.status === 'rascunho'));
    const indicadorAtualizado = await editarIndicador(indicadorOriginal.id, {
      id_setor: 1,
      nome: 'Leitos revisados',
      unidade: 'leitos',
      descricao: null,
    });
    expect(indicadorAtualizado.nome).toBe('Leitos revisados');
    expect(indicadorAtualizado.medicoes).toHaveLength(indicadorOriginal.medicoes.length);

    const medicaoRascunho = indicadorAtualizado.medicoes.find((medicao) => medicao.status === 'rascunho');
    const alterada = await editarMedicao(medicaoRascunho.id, { valor: 25, status: 'publicado' });
    expect(alterada).toMatchObject({ valor: 25, status: 'rascunho' });
    expect(await alterarStatusMedicao(medicaoRascunho.id, 'publicado')).toMatchObject({ status: 'publicado' });
    expect(await alterarStatusRelatorio(1, 'rascunho')).toMatchObject({ status: 'rascunho' });
  });
});
