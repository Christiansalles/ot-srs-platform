import { API_URL } from '../config';
import { mockSetores, mockIndicadores, mockPeriodos, montarDestaques } from '../mocks/dados';

// Mock é uma opção explícita; falhas da API devem chegar às telas.
async function request(path, mockData, filtros = {}) {
  const params = montarQuery(filtros);
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    return structuredClone(typeof mockData === 'function' ? mockData(params) : mockData);
  }
  const query = params.size ? `?${params}` : '';
  const response = await fetch(`${API_URL}/api/${path}${query}`);
  if (!response.ok) throw new Error(`Falha ao consultar ${path} (HTTP ${response.status})`);
  return response.json();
}

export function getSetores() {
  return request('setores', mockSetores);
}

export function getPeriodos() {
  return request('periodos', mockPeriodos);
}

function montarQuery(filtros) {
  const params = new URLSearchParams();
  for (const campo of ['setor', 'ano', 'semestre']) {
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
