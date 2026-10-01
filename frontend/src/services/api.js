import { API_URL } from '../config';
import { mockSetores, mockIndicadores, mockDestaques, mockPeriodos } from '../mocks/dados';

// Mock é uma opção explícita; falhas da API devem chegar às telas.
async function request(path, mockData) {
  if (import.meta.env.VITE_USE_MOCK === 'true') return structuredClone(mockData);
  const response = await fetch(`${API_URL}/api/${path}`);
  if (!response.ok) throw new Error(`Falha ao consultar ${path} (HTTP ${response.status})`);
  return response.json();
}

export function getSetores() {
  return request('setores', mockSetores);
}

export function getPeriodos() {
  return request('periodos', mockPeriodos);
}

export function getIndicadores(setor) {
  const query = setor ? `?setor=${encodeURIComponent(setor)}` : '';
  const data = setor ? mockIndicadores.filter((item) => item.setor.id === Number(setor)) : mockIndicadores;
  return request(`indicadores${query}`, data);
}

export function getDestaques() {
  return request('indicadores/destaques', mockDestaques);
}
