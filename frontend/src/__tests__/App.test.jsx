import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { vi } from 'vitest';
import App from '../App';
import { mockIndicadores } from '../mocks/dados';

describe('App', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
    vi.stubEnv('VITE_USE_MOCK', 'true');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it.each(['/', '/indicadores', '/dashboard', '/relatorios'])('oferece acesso administrativo no cabeçalho de %s', async (caminho) => {
    window.history.replaceState({}, '', caminho);
    render(<App />);
    const acesso = screen.getByRole('link', { name: 'Acesso Administrativo' });
    expect(acesso).toHaveAttribute('href', '/admin/login');
    expect(acesso.closest('header')).toHaveClass('topbar');
    // Aguarda as consultas das páginas antes de encerrar o teste.
    await waitFor(() => expect(screen.queryAllByText(/Carregando/)).toHaveLength(0));
  });

  it('mostra no rodapé as logos de realização, apoio e contexto regional da Proposta', async () => {
    render(<App />);
    const rodape = screen.getByRole('contentinfo');
    [
      'Prefeitura Municipal de Santa Rita do Sapucaí',
      'Secretaria Municipal de Cultura, Esporte, Lazer e Turismo (SMCELT)',
      'Conselho Municipal de Turismo (COMTUR)',
      'Circuito Turístico Caminhos da Mantiqueira',
      'Minas Gerais',
    ].forEach((nome) => expect(within(rodape).getByRole('img', { name: nome })).toBeInTheDocument());
    await waitFor(() => expect(screen.queryAllByText(/Carregando/)).toHaveLength(0));
  });

  it('abre a tela de login pelo acesso administrativo do cabeçalho', async () => {
    window.sessionStorage.clear();
    render(<App />);
    fireEvent.click(screen.getByRole('link', { name: 'Acesso Administrativo' }));
    expect(await screen.findByRole('heading', { name: 'Acesso Administrativo' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/admin/login');
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('renderiza os destaques com o card compartilhado', async () => {
    render(<App />);
    expect(await screen.findByRole('heading', { name: /indicadores do turismo/i })).toBeInTheDocument();
    const card = (await screen.findByRole('heading', { name: 'Número de leitos' })).closest('article');
    expect(within(card).getByText('350')).toBeInTheDocument();
    expect(within(card).getByText('2025/2')).toBeInTheDocument();
    expect(within(card).getByText('12,2%')).toBeInTheDocument();
    const destaques = screen.getAllByRole('article');
    expect(destaques).toHaveLength(4);
    expect(destaques.map((item) => within(item).getByRole('heading').textContent)).toEqual([
      'Número de leitos', 'Fluxo de visitantes', 'Número de empresas', 'Empregos no setor',
    ]);
    expect(screen.queryByRole('heading', { name: 'Participação econômica' })).not.toBeInTheDocument();
  });

  it('exibe cada medição do mock nas colunas da tabela', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('link', { name: /^indicadores$/i }));
    await screen.findByRole('table');
    await screen.findByRole('option', { name: 'Hospedagem' });
    fireEvent.change(screen.getByRole('combobox', { name: 'Setor' }), { target: { value: '1' } });
    await waitFor(() => expect(screen.getByRole('cell', { name: 'Taxa de ocupação' })).toBeInTheDocument());
    const table = screen.getByRole('table');
    const rows = within(table).getAllByRole('row').slice(1);
    const expected = mockIndicadores.filter((item) => item.setor.id === 1)
      .flatMap((item) => item.medicoes.map((measurement) => [
        item.nome, item.setor.nome, item.unidade, String(measurement.ano),
        String(measurement.semestre), measurement.valor.toLocaleString('pt-BR'),
      ]));
    expect(rows).toHaveLength(expected.length);
    rows.forEach((row, index) => {
      expect(within(row).getAllByRole('cell').map((cell) => cell.textContent)).toEqual(expected[index]);
    });
  });

  it('mostra erro na Home quando a API falha', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    render(<App />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar os destaques');
    expect(screen.queryByText('350')).not.toBeInTheDocument();
  });

  it('mostra erro na consulta de indicadores', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false');
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url) =>
      Promise.resolve(url.endsWith('/setores')
        ? { ok: true, json: async () => [{ id: 1, nome: 'Hospedagem' }] }
        : url.endsWith('/periodos')
          ? { ok: true, json: async () => [] }
          : { ok: false, status: 503 })));
    window.history.replaceState({}, '', '/indicadores');
    render(<App />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível consultar os indicadores');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('usa o Dashboard da Karolina na rota dashboard', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('link', { name: /^dashboard$/i }));
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Número de leitos' })).toBeInTheDocument();
  });
});
