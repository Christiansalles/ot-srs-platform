import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminLoginPage from '../pages/AdminLoginPage';
import AdminPage from '../pages/AdminPage';
import { getUsuarioLogado, logout } from '../services/auth';

vi.mock('../services/auth', () => ({
  getUsuarioLogado: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
}));

function renderAdmin() {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('rota administrativa', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redireciona para o login quando não há usuário autenticado', () => {
    getUsuarioLogado.mockReturnValue(null);

    renderAdmin();

    expect(screen.getByRole('heading', { name: 'Acesso Administrativo' })).toBeInTheDocument();
  });

  it('encerra a sessão e volta para o login ao sair', () => {
    getUsuarioLogado.mockReturnValue({ id: 2, nome: 'Admin', email: 'admin@example.com' });

    renderAdmin();
    expect(screen.getByRole('heading', { name: 'Olá, Admin' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Sair' }));

    expect(logout).toHaveBeenCalledOnce();
    expect(screen.getByRole('heading', { name: 'Acesso Administrativo' })).toBeInTheDocument();
  });
});
