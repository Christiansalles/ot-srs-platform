import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AdminPage from '../pages/AdminPage';
import { getSetores } from '../services/api';
import { listarIndicadoresAdmin } from '../services/admin';

vi.mock('../services/api', () => ({ getSetores: vi.fn() }));
vi.mock('../services/admin', () => ({ listarIndicadoresAdmin: vi.fn() }));

const setores = [
  { id: 1, nome: 'Hospedagem' },
  { id: 2, nome: 'Gastronomia' },
];

const indicadores = [
  {
    id: 1,
    nome: 'Número de leitos',
    descricao: 'Capacidade instalada hoteleira',
    unidade: 'leitos',
    setor: setores[0],
    medicoes: [
      { id: 1, ano: 2025, semestre: 1, valor: 312, status: 'publicado' },
      { id: 2, ano: 2025, semestre: 2, valor: 350, status: 'rascunho' },
    ],
  },
  {
    id: 2,
    nome: 'Restaurantes',
    descricao: null,
    unidade: 'estabelecimentos',
    setor: setores[1],
    medicoes: [{ id: 3, ano: 2025, semestre: 2, valor: 40, status: 'publicado' }],
  },
  {
    id: 3,
    nome: 'Diária média',
    descricao: null,
    unidade: 'R$',
    setor: setores[0],
    medicoes: [],
  },
];

function renderPage() {
  return render(<MemoryRouter><AdminPage /></MemoryRouter>);
}

beforeEach(() => {
  vi.resetAllMocks();
  getSetores.mockResolvedValue(setores);
  listarIndicadoresAdmin.mockResolvedValue(indicadores);
});

afterEach(() => vi.restoreAllMocks());

describe('AdminPage', () => {
  it('lista indicadores e medições com valores formatados e selos de status', async () => {
    renderPage();

    const tabela = await screen.findByRole('table');
    expect(within(tabela).getAllByText('Número de leitos')).toHaveLength(2);
    expect(within(tabela).getAllByText('Capacidade instalada hoteleira')).toHaveLength(2);
    expect(within(tabela).getByText('2025/1')).toBeInTheDocument();
    expect(within(tabela).getByText('312 leitos')).toBeInTheDocument();
    expect(within(tabela).getByText('350 leitos')).toBeInTheDocument();
    expect(within(tabela).getAllByText('Publicado')).toHaveLength(2);
    within(tabela).getAllByText('Publicado').forEach((badge) => {
      expect(badge).toHaveClass('status-badge--publicado');
    });
    expect(within(tabela).getByText('Rascunho')).toHaveClass('status-badge--rascunho');
    expect(within(tabela).getByText('Sem medições')).toBeInTheDocument();
    expect(listarIndicadoresAdmin).toHaveBeenCalledOnce();
    expect(listarIndicadoresAdmin).toHaveBeenCalledWith();
  });

  it('abre a edição da medição existente e o cadastro quando o indicador não tem medição', async () => {
    renderPage();

    const tabela = await screen.findByRole('table');
    expect(within(tabela).getByRole('link', { name: 'Editar Número de leitos, 2025/1' }))
      .toHaveAttribute('href', '/admin/medicoes/1/editar');
    expect(within(tabela).getByRole('link', { name: 'Editar Diária média' }))
      .toHaveAttribute('href', '/admin/medicoes/nova?indicador=3');
  });

  it('filtra a listagem pelo status selecionado sem alterar os contadores gerais', async () => {
    renderPage();
    const tabelaInicial = await screen.findByRole('table');
    expect(within(tabelaInicial).getAllByText('Publicado')).toHaveLength(2);

    fireEvent.change(screen.getByRole('combobox', { name: 'Filtrar por status' }), {
      target: { value: 'rascunho' },
    });

    const tabelaFiltrada = screen.getByRole('table');
    expect(within(tabelaFiltrada).getByText('Número de leitos')).toBeInTheDocument();
    expect(within(tabelaFiltrada).getByText('Rascunho')).toBeInTheDocument();
    expect(within(tabelaFiltrada).queryByText('Restaurantes')).not.toBeInTheDocument();
    expect(screen.getByText('2', { selector: '.admin-summary-card--published .admin-summary-card__value' })).toBeInTheDocument();
    expect(screen.getByText('1', { selector: '.admin-summary-card--draft .admin-summary-card__value' })).toBeInTheDocument();
  });

  it('filtra por setor e mostra tela vazia com opção de limpar filtros', async () => {
    renderPage();
    await screen.findByRole('table');

    fireEvent.change(screen.getByRole('combobox', { name: 'Filtrar por setor' }), {
      target: { value: '2' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'Filtrar por status' }), {
      target: { value: 'rascunho' },
    });

    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByText('Nenhum indicador encontrado para os filtros selecionados.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('mostra estado vazio quando a API não retorna indicadores', async () => {
    listarIndicadoresAdmin.mockResolvedValueOnce([]);
    renderPage();

    expect(await screen.findByText('Nenhum indicador encontrado para os filtros selecionados.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('mostra erro e permite tentar novamente', async () => {
    listarIndicadoresAdmin.mockRejectedValueOnce(new Error('Falha da API'))
      .mockResolvedValueOnce(indicadores);
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar os indicadores.');
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(listarIndicadoresAdmin).toHaveBeenCalledTimes(2);
  });

  it('mostra carregamento enquanto os dados estão sendo consultados', async () => {
    let concluir;
    listarIndicadoresAdmin.mockReturnValueOnce(new Promise((resolve) => { concluir = resolve; }));
    renderPage();

    expect(screen.getByRole('status')).toHaveTextContent('Carregando indicadores...');
    concluir(indicadores);
    expect(await screen.findByRole('table')).toBeInTheDocument();
  });
});
