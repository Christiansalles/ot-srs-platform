import { API_URL } from '../config';

const TOKEN_KEY = 'ot-srs-token';
const USER_KEY = 'ot-srs-user';

export async function login(email, senha) {
  let response;
  try {
    response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha }),
    });
  } catch {
    throw new Error('Não foi possível conectar à API. Tente novamente.');
  }

  let dados;
  try {
    dados = await response.json();
  } catch {
    dados = null;
  }

  if (!response.ok) {
    throw new Error(dados?.erro || 'Não foi possível entrar. Tente novamente.');
  }

  if (!dados?.token || !dados?.usuario) {
    throw new Error('A API retornou uma resposta de login inválida.');
  }

  window.sessionStorage.setItem(TOKEN_KEY, dados.token);
  window.sessionStorage.setItem(USER_KEY, JSON.stringify(dados.usuario));
  return dados.usuario;
}

export function getToken() {
  return window.sessionStorage.getItem(TOKEN_KEY);
}

export function getUsuarioLogado() {
  if (!getToken()) return null;

  try {
    return JSON.parse(window.sessionStorage.getItem(USER_KEY));
  } catch {
    logout();
    return null;
  }
}

export function logout() {
  window.sessionStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(USER_KEY);
}
