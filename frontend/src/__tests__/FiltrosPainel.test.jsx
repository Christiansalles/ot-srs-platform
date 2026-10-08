import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { vi } from 'vitest';
import FiltrosPainel from '../components/FiltrosPainel/FiltrosPainel';
import { getPeriodos, getSetores } from '../services/api';
import { mockPeriodos, mockSetores } from '../mocks/dados';

vi.mock('../services/api', () => ({ getPeriodos: vi.fn(), getSetores: vi.fn() }));

function Localizacao() {
  const { pathname, search } = useLocation();
  return <span aria-label="URL">{pathname}{search}</span>;
}

function abrir(url = '/dashboard') {
  return render(<MemoryRouter initialEntries={[url]}><FiltrosPainel /><Localizacao /></MemoryRouter>);
}

beforeEach(() => {
  vi.resetAllMocks();
  getPeriodos.mockResolvedValue(mockPeriodos);
  getSetores.mockResolvedValue(mockSetores);
});

it('lista os anos e setores do mock com labels e sem repetir anos', async () => {
  getPeriodos.mockResolvedValue([...mockPeriodos, { ano: 2025, semestre: 1 }]);
  abrir();
  await screen.findByRole('option', { name: 'Hospedagem' });
  const periodo = screen.getByRole('combobox', { name: 'Período' });
  expect(within(periodo).getAllByRole('option').map((item) => item.value)).toEqual(['', '2023', '2024', '2025']);
  expect(within(screen.getByRole('combobox', { name: 'Setor' })).getByRole('option', { name: 'Hospedagem' })).toHaveValue('1');
  expect(screen.getByRole('combobox', { name: 'Semestre' })).toBeDisabled();
});

it('muda o setor na URL preservando o caminho e outros parâmetros', async () => {
  abrir('/indicadores?ano=2024&semestre=2&pagina=3');
  await screen.findByRole('option', { name: 'Hospedagem' });
  fireEvent.change(screen.getByRole('combobox', { name: 'Setor' }), { target: { value: '1' } });
  expect(screen.getByLabelText('URL')).toHaveTextContent('/indicadores?ano=2024&semestre=2&pagina=3&setor=1');
});

it('mantém as seleções ao abrir novamente o endereço filtrado', async () => {
  const url = '/dashboard?setor=1&ano=2024&semestre=2';
  const tela = abrir(url);
  await screen.findByRole('option', { name: 'Hospedagem' });
  tela.unmount();
  abrir(url);
  await screen.findByRole('option', { name: 'Hospedagem' });
  expect(screen.getByRole('combobox', { name: 'Período' })).toHaveValue('2024');
  expect(screen.getByRole('combobox', { name: 'Semestre' })).toHaveValue('2');
  expect(screen.getByRole('combobox', { name: 'Setor' })).toHaveValue('1');
});

it('seleciona ano e semestre e remove o semestre ao limpar o ano', async () => {
  abrir();
  await screen.findByRole('option', { name: '2024' });
  fireEvent.change(screen.getByRole('combobox', { name: 'Período' }), { target: { value: '2024' } });
  fireEvent.change(screen.getByRole('combobox', { name: 'Semestre' }), { target: { value: '2' } });
  expect(screen.getByLabelText('URL')).toHaveTextContent('/dashboard?ano=2024&semestre=2');
  fireEvent.change(screen.getByRole('combobox', { name: 'Período' }), { target: { value: '' } });
  expect(screen.getByLabelText('URL').textContent).toBe('/dashboard');
  expect(screen.getByRole('combobox', { name: 'Semestre' })).toBeDisabled();
});

it('limpa somente os filtros e mantém os demais parâmetros', async () => {
  abrir('/dashboard?setor=1&ano=2024&semestre=2&pagina=3');
  await screen.findByRole('option', { name: 'Hospedagem' });
  fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));
  expect(screen.getByLabelText('URL').textContent).toBe('/dashboard?pagina=3');
  for (const nome of ['Período', 'Semestre', 'Setor']) expect(screen.getByRole('combobox', { name: nome })).toHaveValue('');
});

it('exibe carregamento enquanto aguarda as opções', () => {
  getPeriodos.mockReturnValue(new Promise(() => {}));
  abrir();
  expect(screen.getByRole('status')).toHaveTextContent('Carregando filtros...');
  expect(screen.getByRole('combobox', { name: 'Período' })).toBeDisabled();
  expect(screen.getByRole('combobox', { name: 'Setor' })).toBeDisabled();
});

it('informa falha ao carregar as opções', async () => {
  getSetores.mockRejectedValue(new Error('Falha na consulta'));
  abrir();
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar os filtros.');
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  expect(screen.getByRole('combobox', { name: 'Setor' })).toBeDisabled();
});
