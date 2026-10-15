import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import HomePage from '../pages/HomePage';
import { getDestaques } from '../services/api';
import { montarCards } from '../pages/Dashboard/montarCards';

vi.mock('../services/api', () => ({ getDestaques: vi.fn() }));

function destaque(id, nome) {
  return { id, nome, valor: id * 10, unidade: 'unidades',
    periodo: { ano: 2025, semestre: 2 }, variacao_percentual: null };
}

function abrir() {
  return render(<MemoryRouter><HomePage /></MemoryRouter>);
}

beforeEach(() => vi.resetAllMocks());

it('seleciona apenas os quatro destaques e segue a ordem do dashboard mesmo com a resposta embaralhada', async () => {
  const dados = [
    destaque(1, 'Empregos no setor'), destaque(2, 'Participação econômica'),
    destaque(3, 'Gasto médio do turista'), destaque(4, 'Número de empresas'),
    destaque(5, 'Taxa de ocupação'), destaque(6, 'Fluxo de visitantes'),
    destaque(7, 'Tempo médio de permanência'), destaque(8, 'Número de leitos'),
  ];
  getDestaques.mockResolvedValue(dados);
  abrir();
  const cards = await screen.findAllByRole('article');
  const nomes = cards.map((card) => within(card).getByRole('heading').textContent);
  expect(nomes).toEqual(['Número de leitos', 'Fluxo de visitantes', 'Número de empresas', 'Empregos no setor']);
  expect(nomes).toEqual(montarCards(dados).slice(0, 4).map((item) => item.nome));
  expect(cards).toHaveLength(4);
  for (const nome of ['Participação econômica', 'Gasto médio do turista', 'Taxa de ocupação', 'Tempo médio de permanência']) {
    expect(screen.queryByRole('heading', { name: nome })).not.toBeInTheDocument();
  }
  expect(screen.getByText(/Dados e informações abertas para acompanhar o turismo/)).toBeInTheDocument();
});

it('exibe somente os destaques disponíveis sem completar a lista com outros indicadores', async () => {
  getDestaques.mockResolvedValue([
    destaque(1, 'Empregos no setor'), destaque(2, 'Participação econômica'), destaque(3, 'Número de leitos'),
  ]);
  abrir();
  const cards = await screen.findAllByRole('article');
  expect(cards.map((card) => within(card).getByRole('heading').textContent))
    .toEqual(['Número de leitos', 'Empregos no setor']);
});

it('mostra o estado sem indicadores quando a resposta não contém destaques da Home', async () => {
  getDestaques.mockResolvedValue([destaque(1, 'Participação econômica')]);
  abrir();
  expect(await screen.findByText('Sem indicadores disponíveis no momento.')).toBeInTheDocument();
  expect(screen.queryByRole('article')).not.toBeInTheDocument();
});
