import { API_URL } from '../config';

const TOKEN_KEY = 'ot-srs-token';
const USER_KEY = 'ot-srs-user';
export const AUTH_UNAUTHORIZED_EVENT = 'ot-srs:unauthorized';

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

export async function getUsuarioAutenticado() {
  const token = getToken();
  if (!token) throw new Error('Sessão não encontrada.');

  let response;
  try {
    response = await fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new Error('Não foi possível verificar a sessão. Tente novamente.');
  }

  if (response.status === 401) {
    logout();
    window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
    throw new Error('Sessão inválida ou expirada.');
  }

  if (!response.ok) {
    throw new Error('Não foi possível verificar a sessão. Tente novamente.');
  }

  let usuario;
  try {
    usuario = await response.json();
  } catch {
    throw new Error('A API retornou uma resposta de sessão inválida.');
  }

  if (!usuario?.id || !usuario?.nome || !usuario?.email) {
    throw new Error('A API retornou uma resposta de sessão inválida.');
  }

  window.sessionStorage.setItem(USER_KEY, JSON.stringify(usuario));
  return usuario;
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

// Só esconde os botões: quem decide o acesso é a API, que responde 403 ao editor.
export function podePublicar() {
  return getUsuarioLogado()?.perfil === 'administrador';
}

export function logout() {
  window.sessionStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(USER_KEY);
}
