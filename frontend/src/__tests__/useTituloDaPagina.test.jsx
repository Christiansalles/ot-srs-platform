import { fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import App from '../App';
import { montarTituloDaPagina, useTituloDaPagina } from '../hooks/useTituloDaPagina';

const ADMINISTRADOR = { id: 1, nome: 'Administrador', email: 'admin@example.com', perfil: 'administrador' };

function entrarNoPainel() {
  window.sessionStorage.setItem('ot-srs-token', 'token-de-teste');
  window.sessionStorage.setItem('ot-srs-user', JSON.stringify(ADMINISTRADOR));
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ADMINISTRADOR }));
}

describe('useTituloDaPagina', () => {
  it('junta o título da página ao nome do site', () => {
    expect(montarTituloDaPagina('Relatórios')).toBe('Relatórios · Observatório do Turismo');
  });

  it('usa o nome completo do site quando a página não tem título próprio', () => {
    expect(montarTituloDaPagina()).toBe('Observatório do Turismo de Santa Rita do Sapucaí');
  });

  it('atualiza o título da aba quando o título muda', () => {
    const { rerender } = renderHook(({ titulo }) => useTituloDaPagina(titulo), {
      initialProps: { titulo: 'Cadastrar medição' },
    });
    expect(document.title).toBe('Cadastrar medição · Observatório do Turismo');

    rerender({ titulo: 'Editar medição' });
    expect(document.title).toBe('Editar medição · Observatório do Turismo');
  });
});

describe('título da aba em cada rota', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_USE_MOCK', 'true');
    window.sessionStorage.clear();
    document.title = '';
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    window.sessionStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  it.each([
    ['/', 'Observatório do Turismo de Santa Rita do Sapucaí'],
    ['/indicadores', 'Indicadores · Observatório do Turismo'],
    ['/dashboard', 'Dashboard · Observatório do Turismo'],
    ['/relatorios', 'Relatórios · Observatório do Turismo'],
    ['/endereco-invalido', 'Página não encontrada · Observatório do Turismo'],
    ['/admin/login', 'Acesso administrativo · Observatório do Turismo'],
  ])('%s mostra "%s"', async (caminho, titulo) => {
    window.history.replaceState({}, '', caminho);
    render(<App />);

    await waitFor(() => expect(document.title).toBe(titulo));
  });

  it.each([
    ['/admin', 'Indicadores · Painel administrativo · Observatório do Turismo'],
    ['/admin/medicoes/nova', 'Cadastrar medição · Painel administrativo · Observatório do Turismo'],
    ['/admin/medicoes/1/editar', 'Editar medição · Painel administrativo · Observatório do Turismo'],
    ['/admin/relatorios', 'Publicador de Relatórios · Painel administrativo · Observatório do Turismo'],
    ['/admin/usuarios', 'Usuários · Painel administrativo · Observatório do Turismo'],
  ])('%s, no painel, mostra "%s"', async (caminho, titulo) => {
    entrarNoPainel();
    window.history.replaceState({}, '', caminho);
    render(<App />);

    await waitFor(() => expect(document.title).toBe(titulo));
  });

  it('troca o título ao navegar pelo menu', async () => {
    render(<App />);
    await waitFor(() => expect(document.title).toBe('Observatório do Turismo de Santa Rita do Sapucaí'));

    fireEvent.click(screen.getByRole('link', { name: 'Relatórios' }));

    await waitFor(() => expect(document.title).toBe('Relatórios · Observatório do Turismo'));
  });
});
