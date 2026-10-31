import { API_URL } from '../config';
import { mockSetores, mockIndicadores, mockPeriodos, montarDestaques } from '../mocks/dados';
import { filtrarRelatoriosMock } from '../mocks/relatorios';
import { AUTH_UNAUTHORIZED_EVENT, getToken, logout } from './auth';

// Mock é uma opção explícita; falhas da API devem chegar às telas.
async function request(path, mockData, filtros = {}, {
  campos = ['setor', 'ano', 'semestre'], mensagemErro, resposta = 'json', usarMock = true,
} = {}) {
  const params = montarQuery(filtros, campos);
  if (usarMock && import.meta.env.VITE_USE_MOCK === 'true') {
    return structuredClone(typeof mockData === 'function' ? mockData(params) : mockData);
  }
  const query = params.size ? `?${params}` : '';
  const token = getToken();
  let response;
  try {
    response = await fetch(`${API_URL}/api/${path}${query}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch (erro) {
    if (mensagemErro) throw new Error(mensagemErro);
    throw erro;
  }
  if (response.status === 401) {
    logout();
    window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
  }
  if (!response.ok) {
    if (mensagemErro) {
      const dados = await response.json().catch(() => null);
      throw new Error(typeof dados?.erro === 'string' && dados.erro.trim() ? dados.erro : mensagemErro);
    }
    throw new Error(`Falha ao consultar ${path} (HTTP ${response.status})`);
  }
  try {
    return await response[resposta]();
  } catch (erro) {
    if (mensagemErro) throw new Error(mensagemErro);
    throw erro;
  }
}

export function getSetores() {
  return request('setores', mockSetores);
}

export function getPeriodos() {
  return request('periodos', mockPeriodos);
}

function montarQuery(filtros, campos) {
  const params = new URLSearchParams();
  for (const campo of campos) {
    const valor = filtros[campo];
    if (valor !== undefined && valor !== null && valor !== '') params.set(campo, valor);
  }
  return params;
}

function filtrarMock(params) {
  if (params.has('setor') && !/^[1-9]\d*$/.test(params.get('setor'))) {
    throw new Error('setor deve ser um número inteiro positivo');
  }
  if (params.has('ano') && !/^\d{4}$/.test(params.get('ano'))) {
    throw new Error('ano deve ser um número inteiro de 4 dígitos');
  }
  if (params.has('semestre') && !/^[12]$/.test(params.get('semestre'))) {
    throw new Error('semestre deve ser 1 ou 2');
  }
  if (params.has('semestre') && !params.has('ano')) throw new Error('semestre exige ano');

  return mockIndicadores
    .filter((item) => !params.has('setor') || item.setor.id === Number(params.get('setor')))
    .map((item) => ({
      ...item,
      medicoes: item.medicoes.filter((medicao) =>
        (!params.has('ano') || medicao.ano === Number(params.get('ano'))) &&
        (!params.has('semestre') || medicao.semestre === Number(params.get('semestre')))),
    }))
    .filter((item) => item.medicoes.length > 0);
}

export function getIndicadores(filtros = {}) {
  return request('indicadores', filtrarMock, filtros);
}

export function getDestaques(filtros = {}) {
  return request('indicadores/destaques', (params) => montarDestaques(filtrarMock(params)), filtros);
}

export function getRelatorios(filtros = {}) {
  return request('relatorios', filtrarRelatoriosMock, filtros, {
    campos: ['ano', 'categoria'],
    mensagemErro: 'Não foi possível consultar os relatórios. Tente novamente.',
  });
}

export function urlDownloadRelatorio(id) {
  return `${API_URL}/api/relatorios/${encodeURIComponent(id)}/arquivo`;
}

export function baixarRelatorio(id) {
  // O mock contém metadados; o PDF sempre vem da rota pública.
  return request(`relatorios/${encodeURIComponent(id)}/arquivo`, null, {}, {
    mensagemErro: 'Não foi possível baixar o relatório. Tente novamente.',
    resposta: 'blob', usarMock: false,
  });
}
