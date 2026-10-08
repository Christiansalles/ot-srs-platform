import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import IndicadoresPage from '../pages/IndicadoresPage';
import HomePage from '../pages/HomePage';
import { getSetores, getIndicadores, getDestaques } from '../services/api';

vi.mock('../services/api', () => ({
  getSetores: vi.fn(),
  getIndicadores: vi.fn(),
  getDestaques: vi.fn(),
}));

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

const sectors = [{ id: 7, nome: 'Hospedagem' }, { id: 9, nome: 'Gastronomia' }];
const indicators = [{
  id: 1, nome: 'Leitos', unidade: 'leitos',
  medicoes: [{ ano: 2025, semestre: 2, valor: 1280.5 }],
}];

beforeEach(() => {
  vi.resetAllMocks();
  getSetores.mockResolvedValue(sectors);
  getIndicadores.mockResolvedValue(indicators);
});

describe('consulta de indicadores', () => {
  it('aguarda os setores e usa o primeiro ID retornado pela API', async () => {
    const pending = deferred();
    getSetores.mockReturnValue(pending.promise);
    render(<IndicadoresPage />);
    expect(screen.getByText('Carregando indicadores...')).toBeInTheDocument();
    expect(getIndicadores).not.toHaveBeenCalled();
    await act(async () => pending.resolve(sectors));
    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveValue('7');
    expect(getIndicadores).toHaveBeenCalledWith({ setor: 7 });
    expect(screen.getByRole('cell', { name: '1.280,5' })).toBeInTheDocument();
  });

  it('exibe carregamento durante a consulta das medições', async () => {
    const pending = deferred();
    getIndicadores.mockReturnValue(pending.promise);
    render(<IndicadoresPage />);
    await screen.findByRole('option', { name: 'Hospedagem' });
    expect(screen.getByText('Carregando indicadores...')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    await act(async () => pending.resolve(indicators));
    expect(await screen.findByRole('table')).toBeInTheDocument();
  });

  it('exibe sem dados quando o setor não tem medições', async () => {
    getIndicadores.mockResolvedValue([]);
    render(<IndicadoresPage />);
    expect(await screen.findByText('Sem dados para esse setor.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('encerra o carregamento sem consultar indicadores quando não há setores', async () => {
    getSetores.mockResolvedValue([]);
    render(<IndicadoresPage />);
    expect(await screen.findByText('Sem dados para esse setor.')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeDisabled();
    expect(getIndicadores).not.toHaveBeenCalled();
  });

  it('troca o setor e substitui as linhas anteriores após carregar', async () => {
    const pending = deferred();
    getIndicadores.mockResolvedValueOnce(indicators).mockReturnValueOnce(pending.promise);
    render(<IndicadoresPage />);
    await screen.findByRole('table');
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '9' } });
    expect(getIndicadores).toHaveBeenLastCalledWith({ setor: 9 });
    expect(screen.getByText('Carregando indicadores...')).toBeInTheDocument();
    await act(async () => pending.resolve([{
      id: 2, nome: 'Restaurantes', unidade: 'estabelecimentos',
      medicoes: [{ ano: 2025, semestre: 2, valor: 40 }],
    }]));
    const table = await screen.findByRole('table');
    expect(within(table).getByText('Restaurantes')).toBeInTheDocument();
    expect(within(table).queryByText('Leitos')).not.toBeInTheDocument();
  });
});

describe('destaques da Home', () => {
  it('exibe carregando e depois sem indicadores quando a resposta está vazia', async () => {
    const pending = deferred();
    getDestaques.mockReturnValue(pending.promise);
    render(<MemoryRouter><HomePage /></MemoryRouter>);
    expect(screen.getByText('Carregando destaques...')).toBeInTheDocument();
    await act(async () => pending.resolve([]));
    expect(await screen.findByText('Sem indicadores disponíveis no momento.')).toBeInTheDocument();
  });
});
