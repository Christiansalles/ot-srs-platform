import {
  mockSetores,
  mockIndicadores,
  mockDestaques,
  mockPeriodos,
} from '../mocks/dados';

const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

async function readJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Falha ao carregar ${url}`);
  }

  return response.json();
}

export async function getSetores() {
  try {
    return await readJson(`${apiBaseUrl}/setores`);
  } catch {
    return mockSetores;
  }
}

export async function getPeriodos() {
  try {
    return await readJson(`${apiBaseUrl}/periodos`);
  } catch {
    return mockPeriodos;
  }
}

export async function getIndicadores(setor) {
  try {
    const url = setor
      ? `${apiBaseUrl}/indicadores?setor=${encodeURIComponent(setor)}`
      : `${apiBaseUrl}/indicadores`;

    return await readJson(url);
  } catch {
    if (!setor) {
      return mockIndicadores;
    }

    return mockIndicadores.filter((indicador) => indicador.setor.id === Number(setor));
  }
}

export async function getDestaques() {
  try {
    return await readJson(`${apiBaseUrl}/indicadores/destaques`);
  } catch {
    return mockDestaques;
  }
}
