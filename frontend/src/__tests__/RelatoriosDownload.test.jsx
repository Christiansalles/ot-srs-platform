import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import RelatoriosPage from '../pages/RelatoriosPage';
import { baixarRelatorio, getRelatorios } from '../services/api';
import { mockRelatorios } from '../mocks/relatorios';

vi.mock('../services/api', async (importarOriginal) => ({
  ...await importarOriginal(), getRelatorios: vi.fn(), baixarRelatorio: vi.fn(),
}));

const criarEndereco = vi.fn();
const liberarEndereco = vi.fn();
let clique;

function abrir() {
  return render(<MemoryRouter initialEntries={['/relatorios?ano=2026']}><RelatoriosPage /></MemoryRouter>);
}

beforeEach(() => {
  vi.resetAllMocks();
  getRelatorios.mockResolvedValue(structuredClone(mockRelatorios));
  baixarRelatorio.mockResolvedValue(new Blob(['%PDF-1.4'], { type: 'application/pdf' }));
  criarEndereco.mockReturnValue('blob:relatorio-de-teste');
  vi.stubGlobal('URL', class extends URL {
    static createObjectURL = criarEndereco;
    static revokeObjectURL = liberarEndereco;
  });
  clique = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('oferece o link da rota de download com nome acessível e tamanho do relatório', async () => {
  abrir();
  for (const relatorio of mockRelatorios) {
    const link = await screen.findByRole('link', { name: `Baixar PDF: ${relatorio.titulo}` });
    expect(link).toHaveAttribute('href', `http://localhost:3000/api/relatorios/${relatorio.id}/arquivo`);
    expect(within(link.closest('article')).getByText(`PDF · ${relatorio.tamanho_kb} KB`)).toBeInTheDocument();
  }
});

it.each([[193, '193 KB'], [2458, '2,4 MB']])('mantém a formatação de %s KB ao lado do link', async (tamanhoKb, texto) => {
  getRelatorios.mockResolvedValue([{ ...mockRelatorios[0], tamanho_kb: tamanhoKb }]);
  abrir();
  const link = await screen.findByRole('link', { name: `Baixar PDF: ${mockRelatorios[0].titulo}` });
  expect(within(link.parentElement).getByText(`PDF · ${texto}`)).toBeInTheDocument();
});

it('salva o arquivo com nome legível, remove o link temporário e libera o endereço', async () => {
  abrir();
  fireEvent.click(await screen.findByRole('link', { name: 'Baixar PDF: Participação econômica do turismo' }));
  await waitFor(() => expect(clique).toHaveBeenCalledOnce());
  expect(baixarRelatorio).toHaveBeenCalledWith(2);
  const linkTemporario = clique.mock.contexts[0];
  expect(linkTemporario.download).toBe('ot-ilus-02-2025-participacao-economica-do-turismo.pdf');
  expect(linkTemporario.href).toBe('blob:relatorio-de-teste');
  expect(linkTemporario).not.toBeInTheDocument();
  await waitFor(() => expect(liberarEndereco).toHaveBeenCalledWith('blob:relatorio-de-teste'));
});

it('mostra o 404 no card, mantém a página e permite tentar novamente', async () => {
  baixarRelatorio.mockRejectedValueOnce(new Error('Relatório não encontrado'));
  abrir();
  const link = await screen.findByRole('link', { name: `Baixar PDF: ${mockRelatorios[0].titulo}` });
  const evento = new MouseEvent('click', { bubbles: true, cancelable: true });
  fireEvent(link, evento);
  expect(evento.defaultPrevented).toBe(true);
  expect(await within(link.closest('article')).findByRole('alert')).toHaveTextContent('Relatório não encontrado');
  expect(screen.getByRole('heading', { level: 1, name: 'Relatórios' })).toBeInTheDocument();
  expect(criarEndereco).not.toHaveBeenCalled();
  expect(clique).not.toHaveBeenCalled();
  fireEvent.click(link);
  await waitFor(() => expect(clique).toHaveBeenCalledOnce());
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it('indica o download em andamento e evita pedidos simultâneos', async () => {
  let resolver;
  baixarRelatorio.mockReturnValueOnce(new Promise((concluir) => { resolver = concluir; }));
  abrir();
  const links = await screen.findAllByRole('link', { name: /^Baixar PDF:/ });
  fireEvent.click(links[0]);
  expect(links[0]).toHaveTextContent('Baixando...');
  expect(links[0]).toHaveAttribute('aria-busy', 'true');
  for (const link of links) expect(link).toHaveAttribute('aria-disabled', 'true');
  fireEvent.click(links[1]);
  expect(baixarRelatorio).toHaveBeenCalledTimes(1);
  await act(async () => resolver(new Blob(['%PDF-1.4'], { type: 'application/pdf' })));
  await waitFor(() => expect(links[0]).toHaveAttribute('aria-busy', 'false'));
  await waitFor(() => expect(liberarEndereco).toHaveBeenCalled());
});
