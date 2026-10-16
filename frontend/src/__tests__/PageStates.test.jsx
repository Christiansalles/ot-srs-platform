import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import IndicadoresPage from '../pages/IndicadoresPage';
import HomePage from '../pages/HomePage';
import { getSetores, getPeriodos, getIndicadores, getDestaques } from '../services/api';

vi.mock('../services/api', () => ({
  getSetores: vi.fn(), getPeriodos: vi.fn(), getIndicadores: vi.fn(), getDestaques: vi.fn(),
}));

function adiarResposta() {
  let resolver;
  const promessa = new Promise((concluir) => { resolver = concluir; });
  return { promessa, resolver };
}

const setores = [{ id: 7, nome: 'Hospedagem' }, { id: 9, nome: 'Gastronomia' }];
const indicadores = [{
  id: 1, nome: 'Leitos', unidade: 'leitos', setor: setores[0],
  medicoes: [{ ano: 2025, semestre: 2, valor: 1280.5 }],
}];

function abrirIndicadores() {
  return render(<MemoryRouter><IndicadoresPage /></MemoryRouter>);
}

beforeEach(() => {
  vi.resetAllMocks();
  getSetores.mockResolvedValue(setores);
  getPeriodos.mockResolvedValue([{ id: 1, ano: 2025, semestre: 2 }]);
  getIndicadores.mockResolvedValue(indicadores);
});

describe('consulta de indicadores', () => {
  it('abre com todos os setores e preserva a formatação em português', async () => {
    abrirIndicadores();
    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Setor' })).toHaveValue('');
    expect(getIndicadores).toHaveBeenCalledWith({ setor: '', ano: '', semestre: '' });
    expect(screen.getByRole('columnheader', { name: 'Setor' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Hospedagem' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '1.280,5' })).toBeInTheDocument();
  });

  it('exibe carregamento durante a consulta das medições', async () => {
    const pendente = adiarResposta();
    getIndicadores.mockReturnValue(pendente.promessa);
    abrirIndicadores();
    await screen.findByRole('option', { name: 'Hospedagem' });
    expect(screen.getByText('Carregando indicadores...')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    await act(async () => pendente.resolver(indicadores));
    expect(await screen.findByRole('table')).toBeInTheDocument();
  });

  it('exibe sem dados e mantém o botão para limpar os filtros', async () => {
    getIndicadores.mockResolvedValue([]);
    abrirIndicadores();
    expect(await screen.findByText(/Sem dados para os filtros selecionados/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Limpar filtros' })).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('encerra o carregamento quando a API retorna listas vazias', async () => {
    getSetores.mockResolvedValue([]);
    getIndicadores.mockResolvedValue([]);
    abrirIndicadores();
    expect(await screen.findByText(/Sem dados para os filtros selecionados/)).toBeInTheDocument();
    expect(screen.queryByText('Carregando indicadores...')).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Setor' })).toHaveValue('');
  });

  it('troca o setor e substitui as linhas anteriores após carregar', async () => {
    const pendente = adiarResposta();
    getIndicadores.mockResolvedValueOnce(indicadores).mockReturnValueOnce(pendente.promessa);
    abrirIndicadores();
    await screen.findByRole('table');
    await screen.findByRole('option', { name: 'Gastronomia' });
    fireEvent.change(screen.getByRole('combobox', { name: 'Setor' }), { target: { value: '9' } });
    expect(getIndicadores).toHaveBeenLastCalledWith({ setor: '9', ano: '', semestre: '' });
    expect(screen.getByText('Carregando indicadores...')).toBeInTheDocument();
    await act(async () => pendente.resolver([{
      id: 2, nome: 'Restaurantes', unidade: 'estabelecimentos', setor: setores[1],
      medicoes: [{ ano: 2025, semestre: 2, valor: 40 }],
    }]));
    const tabela = await screen.findByRole('table');
    expect(within(tabela).getByText('Restaurantes')).toBeInTheDocument();
    expect(within(tabela).queryByText('Leitos')).not.toBeInTheDocument();
  });

  it('ignora uma resposta antiga quando o setor muda antes da consulta terminar', async () => {
    const pendente = adiarResposta();
    getIndicadores.mockReturnValueOnce(pendente.promessa).mockResolvedValue([]);
    abrirIndicadores();
    await screen.findByRole('option', { name: 'Gastronomia' });
    fireEvent.change(screen.getByRole('combobox', { name: 'Setor' }), { target: { value: '9' } });
    await screen.findByText(/Sem dados para os filtros selecionados/);
    await act(async () => pendente.resolver(indicadores));
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('permite consultar outro setor depois de uma falha na consulta', async () => {
    getIndicadores.mockRejectedValueOnce(new Error('Falha na consulta'));
    abrirIndicadores();
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível consultar os indicadores.');
    await screen.findByRole('option', { name: 'Gastronomia' });
    fireEvent.change(screen.getByRole('combobox', { name: 'Setor' }), { target: { value: '9' } });
    await screen.findByRole('table');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('destaques da Home', () => {
  it('exibe carregando e depois sem indicadores quando a resposta está vazia', async () => {
    const pendente = adiarResposta();
    getDestaques.mockReturnValue(pendente.promessa);
    render(<MemoryRouter><HomePage /></MemoryRouter>);
    expect(screen.getByText('Carregando destaques...')).toBeInTheDocument();
    await act(async () => pendente.resolver([]));
    expect(await screen.findByText('Sem indicadores disponíveis no momento.')).toBeInTheDocument();
  });
});
