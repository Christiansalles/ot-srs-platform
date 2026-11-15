import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AdminUsuariosPage from '../pages/AdminUsuariosPage';
import { atualizarUsuario, criarUsuario, getUsuarios } from '../services/admin';

vi.mock('../services/admin', () => ({
  atualizarUsuario: vi.fn(),
  criarUsuario: vi.fn(),
  getUsuarios: vi.fn(),
}));

const usuarios = [
  { id: 1, nome: 'Administrador', email: 'admin@observatorio.local', perfil: 'administrador', ativo: true },
  { id: 2, nome: 'Editor', email: 'editor@observatorio.local', perfil: 'editor', ativo: true },
  { id: 3, nome: 'Carga inicial', email: 'carga-inicial@observatorio.local', perfil: 'administrador', ativo: false },
];

function mostrarPagina() {
  return render(<MemoryRouter><AdminUsuariosPage /></MemoryRouter>);
}

function preencherCadastro({ nome = 'Nova Editora', email = 'nova@example.com', senha = 'senha-inicial' } = {}) {
  fireEvent.change(screen.getByRole('textbox', { name: 'Nome' }), { target: { value: nome } });
  fireEvent.change(screen.getByRole('textbox', { name: 'E-mail' }), { target: { value: email } });
  fireEvent.change(screen.getByLabelText('Senha inicial'), { target: { value: senha } });
}

describe('tela de usuários', () => {
  beforeEach(() => {
    window.sessionStorage.setItem('ot-srs-token', 'jwt-admin');
    window.sessionStorage.setItem('ot-srs-user', JSON.stringify({ id: 1, nome: 'Administrador', perfil: 'administrador' }));
    getUsuarios.mockResolvedValue(structuredClone(usuarios));
  });

  afterEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
  });

  it('lista nome, e-mail, perfil e situação dos usuários', async () => {
    mostrarPagina();

    expect(screen.getByRole('status')).toHaveTextContent('Carregando usuários');
    const tabela = await screen.findByRole('table');
    expect(within(tabela).getAllByRole('row')).toHaveLength(4);
    expect(within(tabela).getByText('editor@observatorio.local')).toBeInTheDocument();
    expect(within(tabela).getByText('Inativo')).toBeInTheDocument();
    expect(within(tabela).getByText('Sua conta')).toBeInTheDocument();
  });

  it('cria um usuário e o mostra na lista', async () => {
    const criado = { id: 4, nome: 'Nova Editora', email: 'nova@example.com', perfil: 'editor', ativo: true };
    criarUsuario.mockResolvedValue(criado);
    mostrarPagina();
    await screen.findByRole('table');
    preencherCadastro({ nome: '  Nova Editora  ', email: 'NOVA@EXAMPLE.COM' });
    fireEvent.click(screen.getByRole('button', { name: 'Criar usuário' }));

    await waitFor(() => expect(criarUsuario).toHaveBeenCalledWith({
      nome: 'Nova Editora', email: 'NOVA@EXAMPLE.COM', senha: 'senha-inicial', perfil: 'editor',
    }));
    expect(await screen.findByText('Usuário Nova Editora criado com sucesso.')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveFocus();
    expect(within(screen.getByRole('table')).getByText('nova@example.com')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Nome' })).toHaveValue('');
  });

  it('mostra 409 de e-mail repetido e mantém os campos digitados', async () => {
    criarUsuario.mockRejectedValue(new Error('Já existe um usuário com este e-mail'));
    mostrarPagina();
    preencherCadastro();
    fireEvent.click(screen.getByRole('button', { name: 'Criar usuário' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Já existe um usuário com este e-mail');
    expect(screen.getByRole('alert')).toHaveFocus();
    expect(screen.getByRole('textbox', { name: 'Nome' })).toHaveValue('Nova Editora');
    expect(screen.getByRole('textbox', { name: 'E-mail' })).toHaveValue('nova@example.com');
    expect(screen.getByLabelText('Senha inicial')).toHaveValue('senha-inicial');
  });

  it('mostra a mensagem 400 recebida da API', async () => {
    criarUsuario.mockRejectedValue(new Error('E-mail inválido'));
    mostrarPagina();
    preencherCadastro();
    fireEvent.click(screen.getByRole('button', { name: 'Criar usuário' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail inválido');
  });

  it('exige confirmação para desativar e permite reativar', async () => {
    atualizarUsuario.mockResolvedValueOnce({ ...usuarios[1], ativo: false });
    mostrarPagina();
    await screen.findByRole('table');

    fireEvent.click(screen.getByRole('button', { name: 'Desativar Editor' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(atualizarUsuario).not.toHaveBeenCalled();
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Desativar usuário' }));
    await waitFor(() => expect(atualizarUsuario).toHaveBeenCalledWith(2, { ativo: false }));
    expect(await screen.findByText('Editor desativado com sucesso.')).toBeInTheDocument();

    atualizarUsuario.mockResolvedValueOnce({ ...usuarios[1], ativo: true });
    fireEvent.click(screen.getByRole('button', { name: 'Reativar Editor' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Reativar usuário' }));
    await waitFor(() => expect(atualizarUsuario).toHaveBeenCalledWith(2, { ativo: true }));
  });

  it('altera perfil e redefine senha sem mostrar a senha na lista', async () => {
    atualizarUsuario.mockResolvedValueOnce({ ...usuarios[1], perfil: 'administrador' })
      .mockResolvedValueOnce({ ...usuarios[1], perfil: 'administrador' });
    mostrarPagina();
    await screen.findByRole('table');

    fireEvent.click(screen.getByRole('button', { name: 'Alterar perfil de Editor' }));
    expect(screen.getByRole('combobox', { name: 'Novo perfil' })).toHaveFocus();
    fireEvent.change(screen.getByRole('combobox', { name: 'Novo perfil' }), { target: { value: 'administrador' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar perfil' }));
    await waitFor(() => expect(atualizarUsuario).toHaveBeenCalledWith(2, { perfil: 'administrador' }));
    expect(await screen.findByText('Perfil de Editor atualizado com sucesso.')).toHaveFocus();

    fireEvent.click(screen.getByRole('button', { name: 'Redefinir senha de Editor' }));
    expect(screen.getByLabelText('Nova senha')).toHaveFocus();
    fireEvent.change(screen.getByLabelText('Nova senha'), { target: { value: 'nova-senha-segura' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar nova senha' }));
    await waitFor(() => expect(atualizarUsuario).toHaveBeenCalledWith(2, { senha: 'nova-senha-segura' }));
    expect(await screen.findByText('Senha de Editor redefinida com sucesso.')).toHaveFocus();
    expect(screen.queryByText('nova-senha-segura')).not.toBeInTheDocument();
  });

  it('leva o foco ao erro de edição, mantém o valor e devolve o foco ao cancelar', async () => {
    atualizarUsuario.mockRejectedValue(new Error('Você não pode desativar nem rebaixar o próprio usuário'));
    mostrarPagina();
    await screen.findByRole('table');
    const botao = screen.getByRole('button', { name: 'Alterar perfil de Administrador' });
    fireEvent.click(botao);
    const perfil = screen.getByRole('combobox', { name: 'Novo perfil' });
    expect(perfil).toHaveFocus();
    fireEvent.change(perfil, { target: { value: 'editor' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar perfil' }));

    const erro = await screen.findByRole('alert');
    expect(erro).toHaveFocus();
    expect(perfil).toHaveValue('editor');
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('combobox', { name: 'Novo perfil' })).not.toBeInTheDocument();
    expect(botao).toHaveFocus();
  });

  it('mantém o erro 409 dentro da edição com foco e mostra o sucesso ao salvar novamente', async () => {
    atualizarUsuario.mockRejectedValueOnce(new Error('Você não pode desativar nem rebaixar o próprio usuário'))
      .mockResolvedValueOnce(usuarios[0]);
    mostrarPagina();
    await screen.findByRole('table');

    fireEvent.click(screen.getByRole('button', { name: 'Alterar perfil de Administrador' }));
    const cartao = screen.getByRole('region', { name: 'Alterar perfil de Administrador' });
    fireEvent.change(within(cartao).getByLabelText('Novo perfil'), { target: { value: 'editor' } });
    fireEvent.click(within(cartao).getByRole('button', { name: 'Salvar perfil' }));

    const erro = await within(cartao).findByRole('alert');
    expect(erro).toHaveTextContent('Você não pode desativar nem rebaixar o próprio usuário');
    expect(erro).toHaveFocus();
    expect(within(cartao).getByLabelText('Novo perfil')).toHaveValue('editor');

    fireEvent.change(within(cartao).getByLabelText('Novo perfil'), { target: { value: 'administrador' } });
    fireEvent.click(within(cartao).getByRole('button', { name: 'Salvar perfil' }));
    const sucesso = await screen.findByText('Perfil de Administrador atualizado com sucesso.');
    expect(sucesso).toHaveFocus();
    expect(screen.queryByRole('region', { name: 'Alterar perfil de Administrador' })).not.toBeInTheDocument();
  });

  it('mostra estado vazio e permite tentar novamente após erro', async () => {
    getUsuarios.mockRejectedValueOnce(new Error('falha')).mockResolvedValueOnce([]);
    mostrarPagina();
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar os usuários');
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByText('Nenhum usuário cadastrado.')).toBeInTheDocument();
  });
});
