import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AdminPage from '../pages/AdminPage';
import { getSetores } from '../services/api';
import { alterarStatusMedicao, listarIndicadoresAdmin } from '../services/admin';

vi.mock('../services/api', () => ({ getSetores: vi.fn() }));
vi.mock('../services/admin', () => ({ alterarStatusMedicao: vi.fn(), listarIndicadoresAdmin: vi.fn() }));

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

function entrarComo(perfil) {
  window.sessionStorage.setItem('ot-srs-token', 'token');
  window.sessionStorage.setItem('ot-srs-user', JSON.stringify({ id: 1, nome: 'Equipe', perfil }));
}

beforeEach(() => {
  vi.resetAllMocks();
  getSetores.mockResolvedValue(setores);
  listarIndicadoresAdmin.mockResolvedValue(indicadores);
  window.sessionStorage.clear();
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
    // Indicador sem medição deixa período e valor em branco, sem traço
    const semMedicao = within(tabela).getByText('Sem medições').closest('tr');
    expect(within(semMedicao).getAllByRole('cell').slice(2, 4).map((celula) => celula.textContent)).toEqual(['', '']);
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

  describe('publicação', () => {
    const contador = (classe) => document.querySelector(`.${classe} .admin-summary-card__value`).textContent;

    it('mostra Publicar no rascunho e Despublicar no publicado para o administrador', async () => {
      entrarComo('administrador');
      renderPage();

      const tabela = await screen.findByRole('table');
      expect(within(tabela).getByRole('button', { name: 'Publicar Número de leitos, 2025/2' })).toBeInTheDocument();
      expect(within(tabela).getByRole('button', { name: 'Despublicar Número de leitos, 2025/1' })).toBeInTheDocument();
      expect(within(tabela).getByRole('button', { name: 'Despublicar Restaurantes, 2025/2' })).toBeInTheDocument();
      // Indicador sem medição não tem o que publicar
      expect(within(tabela).getAllByRole('button')).toHaveLength(3);
    });

    it('esconde os botões do editor, que continua podendo editar', async () => {
      entrarComo('editor');
      renderPage();

      const tabela = await screen.findByRole('table');
      expect(within(tabela).queryByRole('button')).not.toBeInTheDocument();
      expect(within(tabela).getByRole('link', { name: 'Editar Número de leitos, 2025/1' })).toBeInTheDocument();
    });

    async function abrirConfirmacao(nome) {
      fireEvent.click(await screen.findByRole('button', { name: nome }));
      return screen.getByRole('dialog');
    }

    it('leva o foco à mensagem quando a linha publicada sai da lista filtrada', async () => {
      entrarComo('administrador');
      alterarStatusMedicao.mockResolvedValueOnce({ id: 2, ano: 2025, semestre: 2, valor: 350, status: 'publicado' });
      renderPage();

      fireEvent.change(await screen.findByRole('combobox', { name: 'Filtrar por status' }), { target: { value: 'rascunho' } });
      const dialogo = await abrirConfirmacao('Publicar Número de leitos, 2025/2');
      fireEvent.click(within(dialogo).getByRole('button', { name: 'Publicar' }));

      expect(await screen.findByText('Número de leitos, 2025/2: publicada no portal.')).toHaveFocus();
      expect(screen.queryByRole('button', { name: /Número de leitos, 2025\/2/ })).not.toBeInTheDocument();
    });

    it('mantém o foco no botão quando a linha continua na lista', async () => {
      entrarComo('administrador');
      alterarStatusMedicao.mockResolvedValueOnce({ id: 2, ano: 2025, semestre: 2, valor: 350, status: 'publicado' });
      renderPage();

      const botao = await screen.findByRole('button', { name: 'Publicar Número de leitos, 2025/2' });
      botao.focus();
      fireEvent.click(botao);
      fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Publicar' }));

      expect(await screen.findByRole('status')).not.toHaveFocus();
      expect(botao).toHaveFocus();
    });

    it.each([
      ['Filtrar por status', 'publicado'],
      ['Filtrar por setor', '1'],
    ])('tira a mensagem ao usar %s', async (nome, value) => {
      entrarComo('administrador');
      alterarStatusMedicao.mockResolvedValueOnce({ id: 2, ano: 2025, semestre: 2, valor: 350, status: 'publicado' });
      renderPage();

      const dialogo = await abrirConfirmacao('Publicar Número de leitos, 2025/2');
      fireEvent.click(within(dialogo).getByRole('button', { name: 'Publicar' }));
      expect(await screen.findByText('Número de leitos, 2025/2: publicada no portal.')).toBeInTheDocument();

      fireEvent.change(screen.getByRole('combobox', { name: nome }), { target: { value } });

      expect(screen.queryByText('Número de leitos, 2025/2: publicada no portal.')).not.toBeInTheDocument();
    });

    it('tira a mensagem ao limpar os filtros', async () => {
      entrarComo('administrador');
      alterarStatusMedicao.mockResolvedValueOnce({ id: 2, ano: 2025, semestre: 2, valor: 350, status: 'publicado' });
      renderPage();

      fireEvent.change(await screen.findByRole('combobox', { name: 'Filtrar por status' }), { target: { value: 'rascunho' } });
      const dialogo = await abrirConfirmacao('Publicar Número de leitos, 2025/2');
      fireEvent.click(within(dialogo).getByRole('button', { name: 'Publicar' }));
      fireEvent.click(await screen.findByRole('button', { name: 'Limpar filtros' }));

      expect(screen.queryByText('Número de leitos, 2025/2: publicada no portal.')).not.toBeInTheDocument();
    });

    it('tira a mensagem ao buscar', async () => {
      entrarComo('administrador');
      alterarStatusMedicao.mockRejectedValueOnce(new Error('Medição não encontrada'));
      renderPage();

      const dialogo = await abrirConfirmacao('Publicar Número de leitos, 2025/2');
      fireEvent.click(within(dialogo).getByRole('button', { name: 'Publicar' }));
      await screen.findByRole('alert');

      fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'leitos' } });

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('explica a ação no diálogo e não chama a API quando é cancelada', async () => {
      entrarComo('administrador');
      renderPage();

      const dialogo = await abrirConfirmacao('Publicar Número de leitos, 2025/2');

      expect(dialogo).toHaveAccessibleName('Publicar medição?');
      expect(within(dialogo).getByText('Número de leitos - 2025/2')).toBeInTheDocument();
      expect(dialogo).toHaveAccessibleDescription(/Após a publicação, a medição ficará visível no portal público\./);
      fireEvent.click(within(dialogo).getByRole('button', { name: 'Cancelar' }));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(alterarStatusMedicao).not.toHaveBeenCalled();
    });

    it('cancela com Esc e com clique no fundo', async () => {
      entrarComo('administrador');
      renderPage();

      fireEvent(await abrirConfirmacao('Publicar Número de leitos, 2025/2'), new Event('cancel', { cancelable: true }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      fireEvent.click(await abrirConfirmacao('Publicar Número de leitos, 2025/2'));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(alterarStatusMedicao).not.toHaveBeenCalled();
    });

    it('fecha o diálogo ainda na página, para o navegador devolver o foco ao botão', async () => {
      entrarComo('administrador');
      const fechar = vi.spyOn(HTMLDialogElement.prototype, 'close');
      const naPagina = [];
      fechar.mockImplementation(function close() { naPagina.push(this.isConnected); });
      renderPage();

      const dialogo = await abrirConfirmacao('Publicar Número de leitos, 2025/2');
      fireEvent.click(within(dialogo).getByRole('button', { name: 'Cancelar' }));

      expect(naPagina).toEqual([true]);
    });

    it('publica depois de confirmar e atualiza a linha e os contadores sem recarregar', async () => {
      entrarComo('administrador');
      alterarStatusMedicao.mockResolvedValueOnce({ id: 2, ano: 2025, semestre: 2, valor: 350, status: 'publicado' });
      renderPage();

      const dialogo = await abrirConfirmacao('Publicar Número de leitos, 2025/2');
      fireEvent.click(within(dialogo).getByRole('button', { name: 'Publicar' }));

      expect(await screen.findByRole('button', { name: 'Despublicar Número de leitos, 2025/2' })).toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(alterarStatusMedicao).toHaveBeenCalledExactlyOnceWith(2, 'publicado');
      expect(listarIndicadoresAdmin).toHaveBeenCalledOnce();
      expect(within(screen.getByRole('table')).queryByText('Rascunho')).not.toBeInTheDocument();
      expect(contador('admin-summary-card--published')).toBe('3');
      expect(contador('admin-summary-card--draft')).toBe('0');
      expect(screen.getByText('Número de leitos, 2025/2: publicada no portal.')).toBeInTheDocument();
    });

    it('despublica depois de confirmar', async () => {
      entrarComo('administrador');
      alterarStatusMedicao.mockResolvedValueOnce({ id: 1, ano: 2025, semestre: 1, valor: 312, status: 'rascunho' });
      renderPage();

      const dialogo = await abrirConfirmacao('Despublicar Número de leitos, 2025/1');
      expect(dialogo).toHaveAccessibleName('Despublicar medição?');
      fireEvent.click(within(dialogo).getByRole('button', { name: 'Despublicar' }));

      expect(await screen.findByRole('button', { name: 'Publicar Número de leitos, 2025/1' })).toBeInTheDocument();
      expect(alterarStatusMedicao).toHaveBeenCalledExactlyOnceWith(1, 'rascunho');
      expect(contador('admin-summary-card--draft')).toBe('2');
    });

    it('mantém o diálogo aberto e bloqueado enquanto a API responde', async () => {
      entrarComo('administrador');
      let concluir;
      alterarStatusMedicao.mockReturnValueOnce(new Promise((resolve) => { concluir = resolve; }));
      renderPage();

      const dialogo = await abrirConfirmacao('Publicar Número de leitos, 2025/2');
      fireEvent.click(within(dialogo).getByRole('button', { name: 'Publicar' }));

      expect(within(dialogo).getByRole('button', { name: 'Enviando...' })).toBeDisabled();
      expect(within(dialogo).getByRole('button', { name: 'Cancelar' })).toBeDisabled();
      fireEvent(dialogo, new Event('cancel', { cancelable: true }));
      fireEvent.click(dialogo);
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      concluir({ id: 2, status: 'publicado' });
      expect(await screen.findByRole('button', { name: 'Despublicar Número de leitos, 2025/2' })).toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it.each([
      [403, 'Seu perfil não pode publicar conteúdo'],
      [404, 'Medição não encontrada'],
    ])('mostra a mensagem do erro %i e mantém a linha como estava', async (status, mensagem) => {
      entrarComo('administrador');
      alterarStatusMedicao.mockRejectedValueOnce(Object.assign(new Error(mensagem), { status }));
      renderPage();

      const dialogo = await abrirConfirmacao('Publicar Número de leitos, 2025/2');
      fireEvent.click(within(dialogo).getByRole('button', { name: 'Publicar' }));

      expect(await screen.findByRole('alert')).toHaveTextContent(mensagem);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Publicar Número de leitos, 2025/2' })).toBeEnabled();
      expect(contador('admin-summary-card--draft')).toBe('1');
    });
  });
});
