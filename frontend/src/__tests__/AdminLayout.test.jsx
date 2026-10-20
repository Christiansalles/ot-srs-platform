import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import AdminLayout from '../components/AdminLayout/AdminLayout';
import AdminLoginPage from '../pages/AdminLoginPage';
import AdminPage from '../pages/AdminPage';

function entrarComo(usuario) {
  window.sessionStorage.setItem('ot-srs-token', 'token-valido');
  window.sessionStorage.setItem('ot-srs-user', JSON.stringify(usuario));
}

function renderAdmin(caminho = '/admin') {
  return render(
    <MemoryRouter initialEntries={[caminho]}>
      <Routes>
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminPage />} />
          <Route path="medicoes" element={<h1>Cadastrar medição</h1>} />
          <Route path="relatorios" element={<h1>Relatórios</h1>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('AdminLayout', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  afterEach(() => {
    window.sessionStorage.clear();
  });

  it('redireciona para o login quando não há usuário autenticado', () => {
    renderAdmin();

    expect(screen.getByRole('heading', { name: 'Acesso Administrativo' })).toBeInTheDocument();
  });

  it('mostra o nome e o perfil de quem está logado no topo', () => {
    entrarComo({ id: 2, nome: 'Maria Clara', email: 'maria@example.com', perfil: 'editor' });

    renderAdmin();

    const topo = screen.getByRole('banner');
    expect(within(topo).getByText('Maria Clara')).toBeInTheDocument();
    expect(within(topo).getByText('Editor')).toBeInTheDocument();
    expect(within(topo).getByText('MC')).toBeInTheDocument();
  });

  it('usa Administrador quando a sessão ainda não traz o perfil', () => {
    entrarComo({ id: 2, nome: 'Admin', email: 'admin@example.com' });

    renderAdmin();

    expect(within(screen.getByRole('banner')).getByText('Administrador')).toBeInTheDocument();
  });

  it('encerra a sessão e volta para o login ao sair', () => {
    entrarComo({ id: 2, nome: 'Admin', email: 'admin@example.com', perfil: 'admin' });

    renderAdmin();
    fireEvent.click(screen.getByRole('button', { name: 'Sair' }));

    expect(window.sessionStorage.getItem('ot-srs-token')).toBeNull();
    expect(window.sessionStorage.getItem('ot-srs-user')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Acesso Administrativo' })).toBeInTheDocument();
  });

  it('lista os módulos e marca o item ativo conforme a rota', () => {
    entrarComo({ id: 2, nome: 'Admin', email: 'admin@example.com', perfil: 'admin' });

    renderAdmin('/admin/medicoes');

    const menu = screen.getByRole('navigation', { name: 'Menu administrativo' });
    const links = within(menu).getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual(['Painel de gestão', 'Cadastrar medição', 'Relatórios']);
    expect(within(menu).getByRole('link', { name: 'Cadastrar medição' })).toHaveAttribute('aria-current', 'page');
    expect(within(menu).getByRole('link', { name: 'Painel de gestão' })).not.toHaveAttribute('aria-current');

    fireEvent.click(within(menu).getByRole('link', { name: 'Relatórios' }));

    expect(screen.getByRole('heading', { name: 'Relatórios' })).toBeInTheDocument();
    expect(within(menu).getByRole('link', { name: 'Relatórios' })).toHaveAttribute('aria-current', 'page');
    expect(within(menu).getByRole('link', { name: 'Cadastrar medição' })).not.toHaveAttribute('aria-current');
  });

  it('abre e fecha o menu pelo botão do celular', () => {
    entrarComo({ id: 2, nome: 'Admin', email: 'admin@example.com', perfil: 'admin' });

    renderAdmin();
    const botao = screen.getByRole('button', { name: 'Abrir menu' });
    expect(botao).toHaveAttribute('aria-expanded', 'false');
    expect(botao).toHaveAttribute('aria-controls', 'admin-menu');

    fireEvent.click(botao);
    expect(screen.getByRole('button', { name: 'Fechar menu' })).toHaveAttribute('aria-expanded', 'true');

    // Escolher um item fecha o menu.
    fireEvent.click(screen.getByRole('link', { name: 'Relatórios' }));
    expect(screen.getByRole('button', { name: 'Abrir menu' })).toHaveAttribute('aria-expanded', 'false');
  });
});
