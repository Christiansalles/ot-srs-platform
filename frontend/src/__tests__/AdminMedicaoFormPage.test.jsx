import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AdminMedicaoFormPage from '../pages/AdminMedicaoFormPage';
import { mockIndicadoresAdmin } from '../mocks/admin';
import { mockSetores } from '../mocks/dados';
import { getSetores } from '../services/api';
import {
  criarIndicador,
  criarMedicao,
  editarMedicao,
  listarIndicadoresAdmin,
} from '../services/admin';

vi.mock('../services/api', () => ({ getSetores: vi.fn() }));
vi.mock('../services/admin', () => ({
  criarIndicador: vi.fn(),
  criarMedicao: vi.fn(),
  editarMedicao: vi.fn(),
  listarIndicadoresAdmin: vi.fn(),
}));

const setores = mockSetores;
const indicadores = mockIndicadoresAdmin;

function renderForm(caminho = '/admin/medicoes/nova') {
  return render(
    <MemoryRouter initialEntries={[caminho]}>
      <Routes>
        <Route path="/admin/medicoes/nova" element={<AdminMedicaoFormPage />} />
        <Route path="/admin/medicoes/:id/editar" element={<AdminMedicaoFormPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

function preencherMedicao({ ano = '2025', semestre = '2', valor = '350' } = {}) {
  fireEvent.change(screen.getByRole('spinbutton', { name: 'Ano' }), { target: { value: ano } });
  fireEvent.change(screen.getByRole('combobox', { name: 'Semestre' }), { target: { value: semestre } });
  fireEvent.change(screen.getByRole('spinbutton', { name: 'Valor' }), { target: { value: valor } });
}

beforeEach(() => {
  vi.resetAllMocks();
  getSetores.mockResolvedValue(setores);
  listarIndicadoresAdmin.mockResolvedValue(structuredClone(indicadores));
  criarIndicador.mockResolvedValue({
    id: 13,
    nome: 'Novos leitos',
    unidade: 'leitos',
    descricao: null,
    setor: setores[0],
    medicoes: [],
  });
  criarMedicao.mockResolvedValue({ id: 24, ano: 2025, semestre: 2, valor: 350, status: 'rascunho' });
  editarMedicao.mockResolvedValue({ id: 7, ano: 2024, semestre: 2, valor: 28, status: 'rascunho' });
});

afterEach(() => vi.restoreAllMocks());

describe('AdminMedicaoFormPage', () => {
  it('mostra carregamento enquanto consulta indicadores e setores', async () => {
    let concluir;
    listarIndicadoresAdmin.mockReturnValueOnce(new Promise((resolve) => { concluir = resolve; }));
    renderForm();

    expect(screen.getByRole('status')).toHaveTextContent('Carregando formulário...');
    await act(async () => concluir(indicadores));
    expect(await screen.findByRole('heading', { name: 'Cadastrar medição' })).toBeInTheDocument();
  });

  it('mostra erro de consulta e permite tentar novamente', async () => {
    getSetores.mockRejectedValueOnce(new Error('API indisponível'));
    renderForm();

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar os dados do formulário.');
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByRole('heading', { name: 'Cadastrar medição' })).toBeInTheDocument();
    expect(getSetores).toHaveBeenCalledTimes(2);
  });

  it('mostra os campos para selecionar indicador, período e valor', async () => {
    renderForm();

    expect(await screen.findByRole('heading', { name: 'Cadastrar medição' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Indicador' })).toHaveDisplayValue('Selecione um indicador');
    expect(screen.getByRole('option', { name: 'Número de leitos — Hospedagem' })).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Setor' })).not.toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: 'Ano' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Semestre' })).toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: 'Valor' })).toBeInTheDocument();
    expect(screen.getByText(/não é possível cadastrar duas medições/i)).toBeInTheDocument();
  });

  it('não envia o formulário quando os campos obrigatórios estão vazios', async () => {
    renderForm();
    await screen.findByRole('heading', { name: 'Cadastrar medição' });

    fireEvent.submit(screen.getByRole('form', { name: 'Formulário de medição' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Selecione um indicador');
    expect(criarIndicador).not.toHaveBeenCalled();
    expect(criarMedicao).not.toHaveBeenCalled();
  });

  it('pede os dados obrigatórios antes de criar um indicador novo', async () => {
    renderForm();
    await screen.findByRole('heading', { name: 'Cadastrar medição' });
    fireEvent.change(screen.getByRole('combobox', { name: 'Indicador' }), { target: { value: 'novo' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar como rascunho' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Preencha nome, setor e unidade');
    expect(criarIndicador).not.toHaveBeenCalled();
    expect(criarMedicao).not.toHaveBeenCalled();
  });

  it('orienta o cadastro de um novo indicador quando a lista está vazia', async () => {
    listarIndicadoresAdmin.mockResolvedValueOnce([]);
    renderForm();

    expect(await screen.findByText(/Nenhum indicador cadastrado/)).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Cadastrar novo indicador' })).toBeInTheDocument();
  });

  it('recusa ano fora do intervalo aceito pela API antes de enviar', async () => {
    renderForm();
    await screen.findByRole('heading', { name: 'Cadastrar medição' });
    fireEvent.change(screen.getByRole('combobox', { name: 'Indicador' }), { target: { value: '1' } });
    preencherMedicao({ ano: '0000' });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar como rascunho' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Informe um ano válido');
    expect(criarMedicao).not.toHaveBeenCalled();
  });

  it('envia a mensagem 409 e mantém os campos preenchidos', async () => {
    criarMedicao.mockRejectedValueOnce(new Error('Já existe uma medição deste indicador em 2025/2'));
    renderForm();
    await screen.findByRole('heading', { name: 'Cadastrar medição' });
    fireEvent.change(screen.getByRole('combobox', { name: 'Indicador' }), { target: { value: '1' } });
    preencherMedicao();
    fireEvent.click(screen.getByRole('button', { name: 'Salvar como rascunho' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Já existe uma medição deste indicador em 2025/2');
    expect(screen.getByRole('spinbutton', { name: 'Ano' })).toHaveValue(2025);
    expect(screen.getByRole('combobox', { name: 'Semestre' })).toHaveValue('2');
    expect(screen.getByRole('spinbutton', { name: 'Valor' })).toHaveValue(350);
  });

  it('carrega uma medição existente na rota de edição e envia os campos editáveis', async () => {
    renderForm('/admin/medicoes/7/editar');

    expect(await screen.findByRole('heading', { name: 'Editar medição' })).toBeInTheDocument();
    expect(screen.getByText('Participação econômica')).toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: 'Ano' })).toHaveValue(2025);
    expect(screen.getByRole('combobox', { name: 'Semestre' })).toHaveValue('2');
    expect(screen.getByRole('spinbutton', { name: 'Valor' })).toHaveValue(20);

    preencherMedicao({ ano: '2024', semestre: '2', valor: '28' });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() => expect(editarMedicao).toHaveBeenCalledWith('7', {
      valor: 28,
      ano: 2024,
      semestre: 2,
    }));
    expect(await screen.findByRole('status')).toHaveTextContent('Medição atualizada com sucesso.');
  });

  it('abre a edição pelo link com IDs na query string do painel', async () => {
    renderForm('/admin/medicoes/nova?indicador=5&medicao=7');

    expect(await screen.findByRole('heading', { name: 'Editar medição' })).toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: 'Valor' })).toHaveValue(20);
  });

  it('deixa medição publicada somente para leitura', async () => {
    renderForm('/admin/medicoes/3/editar');

    expect(await screen.findByRole('heading', { name: 'Editar medição' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Despublique para editar');
    expect(screen.getByRole('spinbutton', { name: 'Ano' })).toBeDisabled();
    expect(screen.getByRole('combobox', { name: 'Semestre' })).toBeDisabled();
    expect(screen.getByRole('spinbutton', { name: 'Valor' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Salvar alterações' })).not.toBeInTheDocument();
    fireEvent.submit(screen.getByRole('form', { name: 'Formulário de medição' }));
    expect(editarMedicao).not.toHaveBeenCalled();
  });

  it('cria indicador novo e depois cadastra sua medição', async () => {
    renderForm();
    await screen.findByRole('heading', { name: 'Cadastrar medição' });
    fireEvent.change(screen.getByRole('combobox', { name: 'Indicador' }), { target: { value: 'novo' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Nome do indicador' }), { target: { value: 'Novos leitos' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Descrição' }), { target: { value: 'Descrição nova' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Setor' }), { target: { value: '1' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Unidade' }), { target: { value: 'leitos' } });
    preencherMedicao();
    fireEvent.click(screen.getByRole('button', { name: 'Salvar como rascunho' }));

    await waitFor(() => expect(criarIndicador).toHaveBeenCalledWith({
      nome: 'Novos leitos',
      descricao: 'Descrição nova',
      id_setor: 1,
      unidade: 'leitos',
    }));
    await waitFor(() => expect(criarMedicao).toHaveBeenCalledWith({
      id_indicador: 13,
      ano: 2025,
      semestre: 2,
      valor: 350,
    }));
    expect(await screen.findByRole('status')).toHaveTextContent('Medição cadastrada como rascunho.');
  });
});
