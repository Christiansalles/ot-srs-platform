import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { vi } from 'vitest';
import IndicadoresPage from '../pages/IndicadoresPage';
import { mockIndicadores } from '../mocks/dados';

function Navegacao() {
  const { search } = useLocation();
  const navegar = useNavigate();
  return <>
    <span aria-label="Consulta da URL">{search}</span>
    <button onClick={() => navegar(-1)}>Voltar</button>
    <button onClick={() => navegar(1)}>Avançar</button>
  </>;
}

function abrir(consulta = '') {
  return render(<MemoryRouter initialEntries={[`/indicadores${consulta}`]}>
    <IndicadoresPage /><Navegacao />
  </MemoryRouter>);
}

beforeEach(() => vi.stubEnv('VITE_USE_MOCK', 'true'));
afterEach(() => vi.unstubAllEnvs());

it('abre um link por setor com a tabela filtrada e mantém o filtro ao reabrir', async () => {
  const esperadas = mockIndicadores.filter((item) => item.setor.id === 2)
    .reduce((total, item) => total + item.medicoes.length, 0);
  for (let tentativa = 0; tentativa < 2; tentativa++) {
    const tela = abrir('?setor=2');
    const tabela = await screen.findByRole('table');
    await screen.findByRole('option', { name: 'Turismo' });
    expect(screen.getByRole('combobox', { name: 'Setor' })).toHaveValue('2');
    const linhas = within(tabela).getAllByRole('row').slice(1);
    expect(linhas).toHaveLength(esperadas);
    for (const linha of linhas) expect(within(linha).getByRole('cell', { name: 'Turismo' })).toBeInTheDocument();
    tela.unmount();
  }
});

it('combina ano, semestre e setor e limpa para voltar à lista completa', async () => {
  abrir('?setor=2&ano=2024&semestre=2&pagina=3');
  const tabela = await screen.findByRole('table');
  const linhas = within(tabela).getAllByRole('row').slice(1);
  expect(linhas).toHaveLength(3);
  for (const linha of linhas) {
    const celulas = within(linha).getAllByRole('cell');
    expect(celulas[1]).toHaveTextContent('Turismo');
    expect(celulas[3]).toHaveTextContent('2024');
    expect(celulas[4]).toHaveTextContent('2');
  }
  await screen.findByRole('option', { name: 'Turismo' });
  fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));
  const total = mockIndicadores.reduce((soma, item) => soma + item.medicoes.length, 0);
  await waitFor(() => expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(total + 1));
  expect(screen.getByLabelText('Consulta da URL')).toHaveTextContent('?pagina=3');
  for (const nome of ['Período', 'Semestre', 'Setor']) expect(screen.getByRole('combobox', { name: nome })).toHaveValue('');
});

it('recupera a lista completa pelo botão Limpar filtros quando não há resultados', async () => {
  abrir('?ano=2025&semestre=1');
  await screen.findByText(/Sem dados para os filtros selecionados/);
  await screen.findByRole('option', { name: '2025 (Atual)' });
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));
  expect(await screen.findByRole('table')).toBeInTheDocument();
  expect(screen.getByLabelText('Consulta da URL').textContent).toBe('');
});

it.each(['?semestre=2', '?ano=abc&setor=999', '?ano=2019&semestre=2'])('corrige o link inválido %s e consulta todos os setores', async (consulta) => {
  abrir(consulta);
  await waitFor(() => expect(screen.getByLabelText('Consulta da URL').textContent).toBe(''));
  const total = mockIndicadores.reduce((soma, item) => soma + item.medicoes.length, 0);
  await waitFor(() => expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(total + 1));
});

it('recarrega a tabela ao escolher o período e ao voltar e avançar no histórico', async () => {
  abrir('?setor=2');
  await screen.findByRole('option', { name: '2024' });
  fireEvent.change(screen.getByRole('combobox', { name: 'Período' }), { target: { value: '2024' } });
  await waitFor(() => expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(4));
  fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));
  await waitFor(() => expect(screen.getByRole('combobox', { name: 'Período' })).toHaveValue(''));
  await waitFor(() => expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(15));
  fireEvent.click(screen.getByRole('button', { name: 'Avançar' }));
  await waitFor(() => expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(4));
  expect(screen.getByRole('combobox', { name: 'Período' })).toHaveValue('2024');
});
