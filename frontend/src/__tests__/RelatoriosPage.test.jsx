import { act, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RelatoriosPage from '../pages/RelatoriosPage';
import { getRelatorios } from '../services/api';
import { mockRelatorios } from '../mocks/relatorios';

vi.mock('../services/api', () => ({ getRelatorios: vi.fn() }));

beforeEach(() => {
  vi.resetAllMocks();
  getRelatorios.mockResolvedValue(structuredClone(mockRelatorios));
});

describe('página pública de relatórios', () => {
  it('exibe os metadados de cada publicação e o aviso de dados ilustrativos', async () => {
    render(<MemoryRouter><RelatoriosPage /></MemoryRouter>);
    expect(screen.getByRole('heading', { level: 1, name: 'Relatórios' })).toBeInTheDocument();
    expect(screen.getByText(/Os relatórios disponíveis são ilustrativos/)).toHaveTextContent(/Aguardamos os dados oficiais.*SMCELT/);
    const cards = await screen.findAllByRole('article');
    expect(cards).toHaveLength(2);
    expect(screen.getByText('2 relatórios')).toBeInTheDocument();
    mockRelatorios.forEach((relatorio, indice) => {
      const card = within(cards[indice]);
      expect(card.getByRole('heading', { level: 3, name: relatorio.titulo })).toBeInTheDocument();
      expect(cards[indice]).toHaveAccessibleName(relatorio.titulo);
      expect(card.getByText(`Edição ${relatorio.edicao}`)).toBeInTheDocument();
      expect(card.getByText(relatorio.categoria)).toBeInTheDocument();
      expect(card.getByText(relatorio.descricao)).toBeInTheDocument();
      expect(card.getByText('21/10/2026')).toHaveAttribute('datetime', '2026-10-21');
      expect(card.getByText(`PDF · ${relatorio.tamanho_kb} KB`)).toBeInTheDocument();
    });
    expect(getRelatorios).toHaveBeenCalledWith();
  });

  it('mantém o dia da publicação sem deslocamento de fuso horário', async () => {
    getRelatorios.mockResolvedValue([{ ...mockRelatorios[0], data_publicacao: '2026-01-01' }]);
    render(<MemoryRouter><RelatoriosPage /></MemoryRouter>);
    expect(await screen.findByText('01/01/2026')).toHaveAttribute('datetime', '2026-01-01');
    expect(screen.getByText('1 relatório')).toBeInTheDocument();
  });

  it.each([
    [193, '193 KB'],
    [2458, '2,4 MB'],
    [1024, '1 MB'],
    [0, '0 KB'],
    [null, 'Tamanho não informado'],
  ])('formata o tamanho %s como %s', async (tamanhoKb, texto) => {
    getRelatorios.mockResolvedValue([{ ...mockRelatorios[0], tamanho_kb: tamanhoKb }]);
    render(<MemoryRouter><RelatoriosPage /></MemoryRouter>);
    expect(await screen.findByText(`PDF · ${texto}`)).toBeInTheDocument();
  });

  it('exibe carregamento até receber os relatórios', async () => {
    let resolver;
    getRelatorios.mockReturnValue(new Promise((concluir) => { resolver = concluir; }));
    render(<MemoryRouter><RelatoriosPage /></MemoryRouter>);
    expect(screen.getByText('Carregando relatórios...')).toHaveAttribute('role', 'status');
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    await act(async () => resolver(mockRelatorios));
    expect(await screen.findAllByRole('article')).toHaveLength(2);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('informa quando não há relatórios publicados', async () => {
    getRelatorios.mockResolvedValue([]);
    render(<MemoryRouter><RelatoriosPage /></MemoryRouter>);
    expect(await screen.findByText('Nenhum relatório publicado para esse filtro')).toHaveAttribute('role', 'status');
    expect(screen.getByText('0 relatórios')).toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });

  it('exibe a mensagem de erro do serviço e encerra o carregamento', async () => {
    getRelatorios.mockRejectedValue(new Error('Não foi possível consultar os relatórios. Tente novamente.'));
    render(<MemoryRouter><RelatoriosPage /></MemoryRouter>);
    expect(await screen.findByText('Não foi possível consultar os relatórios. Tente novamente.')).toHaveAttribute('role', 'alert');
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('preserva a ordem retornada pelo serviço, inclusive para publicações da mesma data', async () => {
    getRelatorios.mockResolvedValue([mockRelatorios[1], mockRelatorios[0]]);
    render(<MemoryRouter><RelatoriosPage /></MemoryRouter>);
    const cards = await screen.findAllByRole('article');
    expect(cards.map((card) => within(card).getByRole('heading').textContent)).toEqual([
      'Participação econômica do turismo', 'Indicadores do setor hoteleiro',
    ]);
  });
});
