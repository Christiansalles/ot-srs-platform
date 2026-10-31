import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockRelatoriosAdmin } from '../mocks/admin';
import AdminRelatoriosPage from '../pages/AdminRelatoriosPage';
import { alterarStatusRelatorio, enviarRelatorio, listarRelatoriosAdmin } from '../services/admin';

vi.mock('../services/admin', () => ({
  alterarStatusRelatorio: vi.fn(),
  enviarRelatorio: vi.fn(),
  listarRelatoriosAdmin: vi.fn(),
}));

function renderPage() {
  return render(<MemoryRouter><AdminRelatoriosPage /></MemoryRouter>);
}

function entrarComo(perfil) {
  window.sessionStorage.setItem('ot-srs-token', 'token');
  window.sessionStorage.setItem('ot-srs-user', JSON.stringify({ id: 1, nome: 'Equipe', perfil }));
}

function preencherCampos() {
  fireEvent.change(screen.getByRole('textbox', { name: /Título do relatório/ }), { target: { value: 'Novo boletim' } });
  fireEvent.change(screen.getByRole('textbox', { name: /Edição \/ Código/ }), { target: { value: '2026/1' } });
  fireEvent.change(screen.getByRole('combobox', { name: /Categoria temática/ }), { target: { value: 'Setor Hoteleiro' } });
  fireEvent.change(screen.getByLabelText(/Data de publicação/), { target: { value: '2026-10-30' } });
  fireEvent.change(screen.getByRole('textbox', { name: /Descrição curta/ }), { target: { value: 'Resumo do boletim' } });
}

function selecionarArquivo(arquivo) {
  fireEvent.change(screen.getByLabelText(/Arraste o PDF aqui/), { target: { files: [arquivo] } });
}

const arquivoPdf = () => new File(['%PDF-1.4'], 'boletim.pdf', { type: 'application/pdf' });

beforeEach(() => {
  vi.resetAllMocks();
  listarRelatoriosAdmin.mockResolvedValue(structuredClone(mockRelatoriosAdmin));
  window.sessionStorage.clear();
});

afterEach(() => vi.restoreAllMocks());

describe('AdminRelatoriosPage', () => {
  it('mostra campos, categorias, contador e lista com os selos de status', async () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Publicador de Relatórios' })).toBeInTheDocument();
    expect(screen.getByText('0 / 500 caracteres')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Diagnóstico Estratégico' })).toBeInTheDocument();
    const tabela = await screen.findByRole('table');
    expect(within(tabela).getByText('Indicadores do setor hoteleiro')).toBeInTheDocument();
    expect(within(tabela).getAllByText('Publicado')).toHaveLength(2);
    expect(screen.getByLabelText(/Arraste o PDF aqui/)).toHaveAttribute('accept', '.pdf,application/pdf');
    fireEvent.change(screen.getByRole('textbox', { name: /Descrição curta/ }), { target: { value: 'Resumo' } });
    expect(screen.getByText('6 / 500 caracteres')).toBeInTheDocument();
  });

  it('recusa arquivo que não é PDF mesmo com tipo informado como PDF', async () => {
    renderPage();
    await screen.findByRole('table');
    selecionarArquivo(new File(['texto'], 'boletim.txt', { type: 'application/pdf' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Selecione um arquivo PDF válido.');
    expect(enviarRelatorio).not.toHaveBeenCalled();
  });

  it('recusa PDF acima de 10 MiB antes de enviar', async () => {
    renderPage();
    await screen.findByRole('table');
    selecionarArquivo(new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'grande.pdf', { type: 'application/pdf' }));

    expect(screen.getByRole('alert')).toHaveTextContent('O arquivo excede o limite de 10 MiB.');
    expect(enviarRelatorio).not.toHaveBeenCalled();
  });

  it('aceita PDF arrastado e envia os seis campos corretos em FormData', async () => {
    enviarRelatorio.mockResolvedValue({
      id: 3,
      titulo: 'Novo boletim',
      edicao: '2026/1',
      categoria: 'Setor Hoteleiro',
      data_publicacao: '2026-10-30',
      descricao: 'Resumo do boletim',
      tamanho_kb: 1,
      status: 'rascunho',
    });
    renderPage();
    await screen.findByRole('table');
    preencherCampos();
    const arquivo = arquivoPdf();
    fireEvent.drop(screen.getByText('Arraste o PDF aqui ou clique para selecionar *').closest('label'), {
      dataTransfer: { files: [arquivo] },
    });
    // Arquivo pequeno aparece em KB, não como "0 MiB"
    expect(screen.getByText('boletim.pdf').closest('p')).toHaveTextContent('boletim.pdf · 1 KB');
    fireEvent.click(screen.getByRole('button', { name: 'Enviar relatório' }));

    await waitFor(() => expect(enviarRelatorio).toHaveBeenCalledOnce());
    const formData = enviarRelatorio.mock.calls[0][0];
    expect(formData).toBeInstanceOf(FormData);
    expect([...formData.keys()]).toEqual([
      'titulo', 'edicao', 'categoria', 'data_publicacao', 'descricao', 'arquivo',
    ]);
    expect(formData.get('titulo')).toBe('Novo boletim');
    expect(formData.get('edicao')).toBe('2026/1');
    expect(formData.get('categoria')).toBe('Setor Hoteleiro');
    expect(formData.get('data_publicacao')).toBe('2026-10-30');
    expect(formData.get('descricao')).toBe('Resumo do boletim');
    expect(formData.get('arquivo')).toBe(arquivo);
    const linha = await screen.findByRole('row', { name: /Novo boletim/ });
    expect(within(linha).getByText('Rascunho')).toHaveClass('status-badge--rascunho');
    expect(screen.getByText(/Relatório enviado como rascunho/)).toBeInTheDocument();
  });

  it('mantém o formulário e mostra o erro 400 ou 413 da API', async () => {
    enviarRelatorio.mockRejectedValueOnce(Object.assign(new Error('Arquivo PDF obrigatório'), { status: 400 }))
      .mockRejectedValueOnce(Object.assign(new Error('Arquivo muito grande'), { status: 413 }));
    renderPage();
    await screen.findByRole('table');
    preencherCampos();
    selecionarArquivo(arquivoPdf());

    fireEvent.click(screen.getByRole('button', { name: 'Enviar relatório' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Arquivo PDF obrigatório');
    expect(screen.getByRole('textbox', { name: /Título do relatório/ })).toHaveValue('Novo boletim');
    fireEvent.click(screen.getByRole('button', { name: 'Enviar relatório' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Arquivo muito grande'));
    expect(enviarRelatorio).toHaveBeenCalledTimes(2);
  });

  it('indica o envio em andamento e bloqueia novo envio até a resposta', async () => {
    let concluir;
    enviarRelatorio.mockReturnValue(new Promise((resolve) => { concluir = resolve; }));
    renderPage();
    await screen.findByRole('table');
    preencherCampos();
    selecionarArquivo(arquivoPdf());
    fireEvent.click(screen.getByRole('button', { name: 'Enviar relatório' }));

    expect(screen.getByRole('button', { name: 'Enviando relatório...' })).toBeDisabled();
    concluir({
      id: 3,
      titulo: 'Novo boletim',
      edicao: '2026/1',
      categoria: 'Setor Hoteleiro',
      data_publicacao: '2026-10-30',
      descricao: 'Resumo do boletim',
      tamanho_kb: 1,
      status: 'rascunho',
    });
    expect(await screen.findByText(/Relatório enviado como rascunho/)).toBeInTheDocument();
  });

  it('não envia o formulário com campos obrigatórios vazios', async () => {
    renderPage();
    await screen.findByRole('table');
    fireEvent.click(screen.getByRole('button', { name: 'Enviar relatório' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Preencha todos os campos obrigatórios.');
    expect(enviarRelatorio).not.toHaveBeenCalled();
  });

  it('mostra carregamento e lista vazia', async () => {
    let resolver;
    listarRelatoriosAdmin.mockReturnValueOnce(new Promise((resolve) => { resolver = resolve; }));
    renderPage();
    expect(screen.getByRole('status')).toHaveTextContent('Carregando relatórios...');
    resolver([]);
    expect(await screen.findByText('Nenhum relatório cadastrado.')).toBeInTheDocument();
  });

  it('mostra o erro da lista e permite tentar novamente', async () => {
    listarRelatoriosAdmin.mockRejectedValueOnce(new Error('Falha da API'))
      .mockResolvedValueOnce([]);
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('Falha da API');
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByText('Nenhum relatório cadastrado.')).toBeInTheDocument();
    expect(listarRelatoriosAdmin).toHaveBeenCalledTimes(2);
  });

  describe('publicação', () => {
    const [publicado] = mockRelatoriosAdmin;
    const rascunho = { ...mockRelatoriosAdmin[1], status: 'rascunho' };

    function comRascunho() {
      listarRelatoriosAdmin.mockResolvedValue(structuredClone([publicado, rascunho]));
    }

    async function abrirConfirmacao(nome) {
      fireEvent.click(await screen.findByRole('button', { name: nome }));
      return screen.getByRole('dialog');
    }

    it('mostra Publicar no rascunho e Despublicar no publicado para o administrador', async () => {
      entrarComo('administrador');
      comRascunho();
      renderPage();

      const tabela = await screen.findByRole('table');
      expect(within(tabela).getByRole('button', { name: `Despublicar ${publicado.titulo}` })).toBeInTheDocument();
      expect(within(tabela).getByRole('button', { name: `Publicar ${rascunho.titulo}` })).toBeInTheDocument();
      expect(within(tabela).getAllByRole('button')).toHaveLength(2);
    });

    it('esconde os botões e a coluna de ações do editor', async () => {
      entrarComo('editor');
      comRascunho();
      renderPage();

      const tabela = await screen.findByRole('table');
      expect(within(tabela).queryByRole('button')).not.toBeInTheDocument();
      expect(within(tabela).getAllByRole('columnheader')).toHaveLength(5);
    });

    it('explica a ação no diálogo e não chama a API quando é cancelada', async () => {
      entrarComo('administrador');
      comRascunho();
      renderPage();

      const dialogo = await abrirConfirmacao(`Publicar ${rascunho.titulo}`);

      expect(dialogo).toHaveAccessibleName('Publicar relatório?');
      expect(within(dialogo).getByText(`${rascunho.titulo} - ${rascunho.edicao}`)).toBeInTheDocument();
      expect(dialogo).toHaveAccessibleDescription(/Após a publicação, o relatório ficará visível no portal público/);
      fireEvent.click(within(dialogo).getByRole('button', { name: 'Cancelar' }));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(alterarStatusRelatorio).not.toHaveBeenCalled();
    });

    it('publica depois de confirmar e atualiza a linha sem recarregar', async () => {
      entrarComo('administrador');
      comRascunho();
      alterarStatusRelatorio.mockResolvedValueOnce({ ...rascunho, status: 'publicado' });
      renderPage();

      const dialogo = await abrirConfirmacao(`Publicar ${rascunho.titulo}`);
      fireEvent.click(within(dialogo).getByRole('button', { name: 'Publicar' }));

      expect(await screen.findByRole('button', { name: `Despublicar ${rascunho.titulo}` })).toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(alterarStatusRelatorio).toHaveBeenCalledExactlyOnceWith(rascunho.id, 'publicado');
      expect(listarRelatoriosAdmin).toHaveBeenCalledOnce();
      expect(within(screen.getByRole('table')).queryByText('Rascunho')).not.toBeInTheDocument();
      expect(screen.getByText(`${rascunho.titulo}: publicado no portal.`)).toBeInTheDocument();
    });

    it('despublica depois de confirmar', async () => {
      entrarComo('administrador');
      comRascunho();
      alterarStatusRelatorio.mockResolvedValueOnce({ ...publicado, status: 'rascunho' });
      renderPage();

      const dialogo = await abrirConfirmacao(`Despublicar ${publicado.titulo}`);
      expect(dialogo).toHaveAccessibleName('Despublicar relatório?');
      fireEvent.click(within(dialogo).getByRole('button', { name: 'Despublicar' }));

      expect(await screen.findByRole('button', { name: `Publicar ${publicado.titulo}` })).toBeInTheDocument();
      expect(alterarStatusRelatorio).toHaveBeenCalledExactlyOnceWith(publicado.id, 'rascunho');
      expect(screen.getByText(`${publicado.titulo}: voltou para rascunho.`)).toBeInTheDocument();
    });

    it('mantém o diálogo aberto e bloqueado enquanto a API responde', async () => {
      entrarComo('administrador');
      comRascunho();
      let concluir;
      alterarStatusRelatorio.mockReturnValueOnce(new Promise((resolve) => { concluir = resolve; }));
      renderPage();

      const dialogo = await abrirConfirmacao(`Publicar ${rascunho.titulo}`);
      fireEvent.click(within(dialogo).getByRole('button', { name: 'Publicar' }));

      expect(within(dialogo).getByRole('button', { name: 'Enviando...' })).toBeDisabled();
      expect(within(dialogo).getByRole('button', { name: 'Cancelar' })).toBeDisabled();
      concluir({ ...rascunho, status: 'publicado' });
      expect(await screen.findByRole('button', { name: `Despublicar ${rascunho.titulo}` })).toBeInTheDocument();
    });

    it.each([
      [403, 'Seu perfil não pode publicar conteúdo'],
      [404, 'Recurso não encontrado'],
    ])('mostra a mensagem do erro %i e mantém a linha como estava', async (status, mensagem) => {
      entrarComo('administrador');
      comRascunho();
      alterarStatusRelatorio.mockRejectedValueOnce(Object.assign(new Error(mensagem), { status }));
      renderPage();

      const dialogo = await abrirConfirmacao(`Publicar ${rascunho.titulo}`);
      fireEvent.click(within(dialogo).getByRole('button', { name: 'Publicar' }));

      expect(await screen.findByRole('alert')).toHaveTextContent(mensagem);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: `Publicar ${rascunho.titulo}` })).toBeEnabled();
    });

    it('tira a mensagem da publicação ao enviar outro relatório', async () => {
      entrarComo('administrador');
      comRascunho();
      alterarStatusRelatorio.mockResolvedValueOnce({ ...rascunho, status: 'publicado' });
      renderPage();

      const dialogo = await abrirConfirmacao(`Publicar ${rascunho.titulo}`);
      fireEvent.click(within(dialogo).getByRole('button', { name: 'Publicar' }));
      expect(await screen.findByText(`${rascunho.titulo}: publicado no portal.`)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Enviar relatório' }));

      expect(screen.queryByText(`${rascunho.titulo}: publicado no portal.`)).not.toBeInTheDocument();
    });

    it('tira o aviso do envio ao publicar, porque ele diria que o relatório não está no portal', async () => {
      entrarComo('administrador');
      comRascunho();
      enviarRelatorio.mockResolvedValue({ ...rascunho, id: 3, titulo: 'Novo boletim' });
      renderPage();
      await screen.findByRole('table');
      preencherCampos();
      selecionarArquivo(arquivoPdf());
      fireEvent.click(screen.getByRole('button', { name: 'Enviar relatório' }));
      expect(await screen.findByText(/Relatório enviado como rascunho/)).toBeInTheDocument();

      await abrirConfirmacao('Publicar Novo boletim');

      expect(screen.queryByText(/Relatório enviado como rascunho/)).not.toBeInTheDocument();
    });
  });
});
