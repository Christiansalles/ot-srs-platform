import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import RotaProtegida from '../components/RotaProtegida';
import AdminLoginPage from '../pages/AdminLoginPage';
import AdminPage from '../pages/AdminPage';

function renderRotas() {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route element={<RotaProtegida />}>
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('RotaProtegida', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    window.sessionStorage.clear();
  });

  it('redireciona para o login quando não há token', () => {
    renderRotas();

    expect(screen.getByRole('heading', { name: 'Acesso Administrativo' })).toBeInTheDocument();
  });

  it('confere o token com /me e mostra o nome devolvido pela API', async () => {
    window.sessionStorage.setItem('ot-srs-token', 'token-valido');
    window.sessionStorage.setItem('ot-srs-user', JSON.stringify({ id: 2, nome: 'Nome desatualizado' }));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 2, nome: 'Admin autenticado', email: 'admin@example.com' }),
    }));

    renderRotas();

    expect(screen.getByRole('status')).toHaveTextContent('Verificando sessão');
    expect(await screen.findByRole('heading', { name: 'Olá, Admin autenticado' })).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/auth/me', {
      headers: { Authorization: 'Bearer token-valido' },
    });
  });

  it('apaga a sessão e redireciona /admin ao login quando /me responde 401', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }));
    window.sessionStorage.setItem('ot-srs-token', 'token-expirado');
    window.sessionStorage.setItem('ot-srs-user', JSON.stringify({ id: 2, nome: 'Admin' }));

    renderRotas();

    expect(await screen.findByRole('heading', { name: 'Acesso Administrativo' })).toBeInTheDocument();
    await waitFor(() => expect(window.sessionStorage.getItem('ot-srs-token')).toBeNull());
    expect(window.sessionStorage.getItem('ot-srs-user')).toBeNull();
    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/auth/me', {
      headers: { Authorization: 'Bearer token-expirado' },
    });
  });
});
