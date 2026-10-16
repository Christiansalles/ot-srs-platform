import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminLoginPage from '../pages/AdminLoginPage';
import { getToken, login } from '../services/auth';

vi.mock('../services/auth', () => ({ getToken: vi.fn(), login: vi.fn() }));

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/admin/login']}>
      <Routes>
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<h1>Painel administrativo</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('tela de login administrativa', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getToken.mockReturnValue(null);
  });

  it('redireciona para /admin quando já existe uma sessão', () => {
    getToken.mockReturnValue('token-existente');

    renderLogin();

    expect(screen.getByRole('heading', { name: 'Painel administrativo' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Acesso Administrativo' })).not.toBeInTheDocument();
  });

  it('mostra e esconde a senha e não oferece recuperação de senha', () => {
    renderLogin();
    const senha = screen.getByLabelText('Senha');

    expect(senha).toHaveAttribute('type', 'password');
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }));
    expect(senha).toHaveAttribute('type', 'text');
    fireEvent.click(screen.getByRole('button', { name: 'Esconder senha' }));
    expect(senha).toHaveAttribute('type', 'password');
    expect(screen.queryByText(/esqueceu sua senha/i)).not.toBeInTheDocument();
  });

  it('mostra carregamento e navega para /admin após login com sucesso', async () => {
    let concluirLogin;
    login.mockReturnValue(new Promise((resolve) => { concluirLogin = resolve; }));
    renderLogin();

    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'admin@example.com' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(screen.getByRole('button', { name: /entrando/i })).toBeDisabled();
    concluirLogin({ id: 2, nome: 'Admin', email: 'admin@example.com' });

    expect(await screen.findByRole('heading', { name: 'Painel administrativo' })).toBeInTheDocument();
    expect(login).toHaveBeenCalledWith('admin@example.com', 'senha');
  });

  it('exibe o erro 401 e permanece na tela de login', async () => {
    login.mockRejectedValue(new Error('E-mail ou senha inválidos'));
    renderLogin();

    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'admin@example.com' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'errada' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha inválidos');
    expect(screen.getByRole('heading', { name: 'Acesso Administrativo' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Entrar' })).toBeEnabled());
  });
});
