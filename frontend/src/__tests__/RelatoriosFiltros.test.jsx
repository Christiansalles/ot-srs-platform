import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import RelatoriosPage from '../pages/RelatoriosPage';
import { getRelatorios, getPeriodos, getSetores } from '../services/api';
import { mockRelatorios } from '../mocks/relatorios';

vi.mock('../services/api', () => ({ getRelatorios: vi.fn(), getPeriodos: vi.fn(), getSetores: vi.fn() }));

const publicacoes = [...mockRelatorios, { ...mockRelatorios[0], id: 3, data_publicacao: '2024-01-01' }];

function Localizacao() {
  const { pathname, search } = useLocation();
  const navegar = useNavigate();
  return <><output aria-label="URL">{pathname}{search}</output><button onClick={() => navegar(-1)}>Voltar</button></>;
}

function abrir(url = '/relatorios') {
  return render(<MemoryRouter initialEntries={[url]}><RelatoriosPage /><Localizacao /></MemoryRouter>);
}

beforeEach(() => {
  vi.resetAllMocks();
  getRelatorios.mockImplementation(async ({ ano, categoria } = {}) => structuredClone(publicacoes.filter((relatorio) =>
    (!ano || relatorio.data_publicacao.startsWith(String(ano))) && (!categoria || relatorio.categoria === categoria))));
});

it('recebe as opções de anos publicados, sem usar períodos nem setores dos indicadores', async () => {
  abrir();
  await screen.findByRole('article', { name: 'Participação econômica do turismo' });
  const ano = screen.getByRole('combobox', { name: 'Ano de publicação' });
  expect(within(ano).getAllByRole('option').map((opcao) => opcao.value)).toEqual(['', '2026', '2024']);
  expect(screen.getAllByRole('combobox')).toHaveLength(2);
  expect(screen.queryByRole('combobox', { name: 'Setor' })).not.toBeInTheDocument();
  expect(screen.queryByRole('combobox', { name: 'Semestre' })).not.toBeInTheDocument();
  expect(getPeriodos).not.toHaveBeenCalled();
  expect(getSetores).not.toHaveBeenCalled();
});

it('troca o ano na URL e refaz a busca sem perder as opções do catálogo completo', async () => {
  abrir();
  await screen.findAllByRole('article');
  fireEvent.change(screen.getByRole('combobox', { name: 'Ano de publicação' }), { target: { value: '2026' } });
  await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(2));
  expect(getRelatorios).toHaveBeenLastCalledWith({ ano: '2026', categoria: '' });
  expect(screen.getByLabelText('URL')).toHaveTextContent('/relatorios?ano=2026');
  expect(screen.getByRole('option', { name: '2024' })).toBeInTheDocument();
});

it('combina ano e categoria e mantém ambos ao abrir novamente a URL', async () => {
  const url = '/relatorios?ano=2026&categoria=Impacto+Econ%C3%B4mico';
  const tela = abrir(url);
  await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(1));
  expect(screen.getByRole('article')).toHaveAccessibleName('Participação econômica do turismo');
  expect(getRelatorios).toHaveBeenCalledWith({ ano: '2026', categoria: 'Impacto Econômico' });
  tela.unmount();
  abrir(url);
  await screen.findByRole('article');
  expect(screen.getByRole('combobox', { name: 'Ano de publicação' })).toHaveValue('2026');
  expect(screen.getByRole('combobox', { name: 'Categoria' })).toHaveValue('Impacto Econômico');
});

it('guarda a categoria na URL e limpa somente os filtros de relatórios', async () => {
  abrir('/relatorios?ano=2026&origem=home');
  await screen.findAllByRole('article');
  fireEvent.change(screen.getByRole('combobox', { name: 'Categoria' }), { target: { value: 'Impacto Econômico' } });
  await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(1));
  expect(screen.getByLabelText('URL')).toHaveTextContent('categoria=Impacto+Econ%C3%B4mico');
  fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));
  await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(3));
  expect(screen.getByLabelText('URL').textContent).toBe('/relatorios?origem=home');
  expect(screen.getByRole('combobox', { name: 'Ano de publicação' })).toHaveValue('');
  expect(screen.getByRole('combobox', { name: 'Categoria' })).toHaveValue('');
});

it('aceita categorias válidas sem publicações e permite limpar o filtro', async () => {
  abrir();
  await screen.findAllByRole('article');
  fireEvent.change(screen.getByRole('combobox', { name: 'Categoria' }), { target: { value: 'Perfil de Demanda' } });
  expect(await screen.findByText('Nenhum relatório publicado para esse filtro')).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'Diagnóstico Estratégico' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));
  expect(await screen.findAllByRole('article')).toHaveLength(3);
});

it('preserva ano válido sem publicações recebido pela URL e mostra o estado vazio', async () => {
  abrir('/relatorios?ano=2025');
  await screen.findByText('Nenhum relatório publicado para esse filtro');
  expect(screen.getByRole('combobox', { name: 'Ano de publicação' })).toHaveValue('2025');
  expect(screen.getByLabelText('URL').textContent).toBe('/relatorios?ano=2025');
});

it('acompanha a navegação de voltar entre filtros', async () => {
  abrir();
  await screen.findAllByRole('article');
  fireEvent.change(screen.getByRole('combobox', { name: 'Categoria' }), { target: { value: 'Impacto Econômico' } });
  await screen.findByRole('article', { name: 'Participação econômica do turismo' });
  fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));
  await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(3));
  expect(screen.getByLabelText('URL').textContent).toBe('/relatorios');
});

it('ignora resposta antiga quando o filtro muda antes de a consulta terminar', async () => {
  let resolver;
  const consultar = getRelatorios.getMockImplementation();
  getRelatorios.mockImplementation((filtros) => filtros?.categoria === 'Perfil de Demanda'
    ? new Promise((concluir) => { resolver = concluir; }) : consultar(filtros));
  abrir();
  await screen.findAllByRole('article');
  const categoria = screen.getByRole('combobox', { name: 'Categoria' });
  fireEvent.change(categoria, { target: { value: 'Perfil de Demanda' } });
  expect(screen.getByText('Carregando relatórios...')).toBeInTheDocument();
  fireEvent.change(categoria, { target: { value: 'Impacto Econômico' } });
  await screen.findByRole('article', { name: 'Participação econômica do turismo' });
  await act(async () => resolver([]));
  expect(screen.queryByText('Nenhum relatório publicado para esse filtro')).not.toBeInTheDocument();
  expect(screen.getByRole('article')).toHaveAccessibleName('Participação econômica do turismo');
});

it('permite escolher outro filtro depois de erro da consulta filtrada', async () => {
  const consultar = getRelatorios.getMockImplementation();
  getRelatorios.mockImplementation((filtros) => filtros?.categoria === 'Perfil de Demanda'
    ? Promise.reject(new Error('Falha ao consultar os relatórios.')) : consultar(filtros));
  abrir();
  await screen.findAllByRole('article');
  fireEvent.change(screen.getByRole('combobox', { name: 'Categoria' }), { target: { value: 'Perfil de Demanda' } });
  expect(await screen.findByRole('alert')).toHaveTextContent('Falha ao consultar os relatórios.');
  fireEvent.change(screen.getByRole('combobox', { name: 'Categoria' }), { target: { value: 'Impacto Econômico' } });
  await screen.findByRole('article', { name: 'Participação econômica do turismo' });
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
