import { useEffect } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import RotaProtegida from '../components/RotaProtegida';
import AdminLoginPage from '../pages/AdminLoginPage';
import AdminPage from '../pages/AdminPage';
import { getSetores } from '../services/api';

function ConsultaProtegida() {
  useEffect(() => {
    getSetores().catch(() => {});
  }, []);

  return <p>Conteúdo protegido</p>;
}

function renderRotas() {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route element={<RotaProtegida />}>
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/consulta" element={<ConsultaProtegida />} />
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

  it('mostra a página administrativa quando há token e usuário', () => {
    window.sessionStorage.setItem('ot-srs-token', 'token-valido');
    window.sessionStorage.setItem('ot-srs-user', JSON.stringify({ id: 2, nome: 'Admin' }));

    renderRotas();

    expect(screen.getByRole('heading', { name: 'Olá, Admin' })).toBeInTheDocument();
  });

  it('apaga a sessão e redireciona ao login quando a API responde 401', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }));
    window.sessionStorage.setItem('ot-srs-token', 'token-expirado');
    window.sessionStorage.setItem('ot-srs-user', JSON.stringify({ id: 2, nome: 'Admin' }));

    window.history.replaceState({}, '', '/admin/consulta');
    render(
      <MemoryRouter initialEntries={['/admin/consulta']}>
        <Routes>
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route element={<RotaProtegida />}>
            <Route path="/admin/consulta" element={<ConsultaProtegida />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'Acesso Administrativo' })).toBeInTheDocument();
    await waitFor(() => expect(window.sessionStorage.getItem('ot-srs-token')).toBeNull());
    expect(window.sessionStorage.getItem('ot-srs-user')).toBeNull();
  });
});
