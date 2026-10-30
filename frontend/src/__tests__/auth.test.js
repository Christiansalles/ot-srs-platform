import { afterEach, describe, expect, it, vi } from 'vitest';
import { getToken, getUsuarioLogado, login, logout, podePublicar } from '../services/auth';

describe('serviço de autenticação', () => {
  afterEach(() => {
    window.sessionStorage.clear();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('envia credenciais e guarda token e usuário na sessão', async () => {
    vi.stubEnv('VITE_API_URL', 'http://localhost:3000');
    const dados = {
      token: 'jwt-de-teste',
      usuario: { id: 2, nome: 'Admin', email: 'admin@example.com' },
    };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => dados });
    vi.stubGlobal('fetch', fetchMock);

    await expect(login('admin@example.com', 'senha')).resolves.toEqual(dados.usuario);

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', senha: 'senha' }),
    });
    expect(getToken()).toBe('jwt-de-teste');
    expect(getUsuarioLogado()).toEqual(dados.usuario);
  });

  it('preserva a mensagem de erro enviada pela API e não cria sessão', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ erro: 'E-mail ou senha inválidos' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(login('admin@example.com', 'errada')).rejects.toThrow('E-mail ou senha inválidos');
    expect(getToken()).toBeNull();
    expect(getUsuarioLogado()).toBeNull();
  });

  it('guarda o perfil do login e só libera a publicação para o administrador', async () => {
    const entrar = (perfil) => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ token: 'jwt', usuario: { id: 2, nome: 'Equipe', email: 'e@example.com', perfil } }),
      }));
      return login('e@example.com', 'senha');
    };

    await entrar('administrador');
    expect(getUsuarioLogado().perfil).toBe('administrador');
    expect(podePublicar()).toBe(true);

    await entrar('editor');
    expect(getUsuarioLogado().perfil).toBe('editor');
    expect(podePublicar()).toBe(false);
  });

  it('não libera a publicação sem sessão ou com sessão sem perfil', () => {
    expect(podePublicar()).toBe(false);

    window.sessionStorage.setItem('ot-srs-token', 'jwt');
    window.sessionStorage.setItem('ot-srs-user', JSON.stringify({ id: 2, nome: 'Equipe' }));
    expect(podePublicar()).toBe(false);
  });

  it('remove token e usuário ao sair', () => {
    window.sessionStorage.setItem('ot-srs-token', 'jwt-de-teste');
    window.sessionStorage.setItem('ot-srs-user', JSON.stringify({ id: 2, nome: 'Admin' }));

    logout();

    expect(getToken()).toBeNull();
    expect(getUsuarioLogado()).toBeNull();
  });
});
