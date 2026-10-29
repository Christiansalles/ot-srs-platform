const request = require('supertest');

jest.mock('../src/services/dados');
jest.mock('../src/services/auth', () => ({
  buscarUsuarioAutenticado: jest.fn(),
  ERRO_TOKEN: 'Token inválido ou expirado',
}));

const dados = require('../src/services/dados');
const { buscarUsuarioAutenticado } = require('../src/services/auth');
const app = require('../src/app');

const token = 'token-e12';
const medicaoRascunho = { id: 5, ano: 2025, semestre: 2, valor: 350, status: 'rascunho' };

beforeEach(() => {
  jest.clearAllMocks();
  buscarUsuarioAutenticado.mockResolvedValue({ id: 17, nome: 'Editora', perfil: 'editor' });
});

function autenticada(requisicao) {
  return requisicao.set('Authorization', `Bearer ${token}`);
}

describe('rotas administrativas E12', () => {
  it('cria indicador como editor e responde 201', async () => {
    const indicador = { id: 2, nome: 'Leitos', unidade: 'leitos', descricao: null, setor: { id: 1, nome: 'Hotelaria' }, medicoes: [] };
    dados.criarIndicador.mockResolvedValue(indicador);

    const res = await autenticada(request(app).post('/api/admin/indicadores'))
      .send({ id_setor: 1, nome: ' Leitos ', unidade: ' leitos ', status: 'publicado' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(indicador);
    expect(dados.criarIndicador).toHaveBeenCalledWith({ id_setor: 1, nome: 'Leitos', descricao: undefined, unidade: 'leitos' });
  });

  it('responde 400 com a mensagem padronizada para indicador inválido', async () => {
    const res = await autenticada(request(app).post('/api/admin/indicadores')).send({ id_setor: 1, nome: '', unidade: 'kg' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ erro: 'Campos obrigatórios inválidos' });
    expect(dados.criarIndicador).not.toHaveBeenCalled();
  });

  it('diferencia setor inválido de indicador inexistente na edição', async () => {
    dados.atualizarIndicador.mockResolvedValueOnce({ setorInvalido: true }).mockResolvedValueOnce(null);

    const setorInvalido = await autenticada(request(app).put('/api/admin/indicadores/5'))
      .send({ id_setor: 404, nome: 'Leitos', unidade: 'leitos' });
    const naoEncontrado = await autenticada(request(app).put('/api/admin/indicadores/404'))
      .send({ id_setor: 1, nome: 'Leitos', unidade: 'leitos' });

    expect(setorInvalido.status).toBe(400);
    expect(setorInvalido.body).toEqual({ erro: 'Campos obrigatórios inválidos' });
    expect(naoEncontrado.status).toBe(404);
    expect(naoEncontrado.body).toEqual({ erro: 'Recurso não encontrado' });
  });

  it('cria medição em rascunho usando o usuário autenticado e ignora status', async () => {
    dados.criarMedicao.mockResolvedValue(medicaoRascunho);

    const res = await autenticada(request(app).post('/api/admin/medicoes'))
      .send({ id_indicador: 3, ano: 2025, semestre: 2, valor: 350, status: 'publicado' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(medicaoRascunho);
    expect(dados.criarMedicao).toHaveBeenCalledWith({
      id_indicador: 3, ano: 2025, semestre: 2, valor: 350, id_usuario: 17,
    });
  });

  it('devolve o conflito de duplicidade com ano e semestre', async () => {
    dados.criarMedicao.mockResolvedValue({ conflito: true, ano: 2025, semestre: 2 });

    const res = await autenticada(request(app).post('/api/admin/medicoes'))
      .send({ id_indicador: 3, ano: 2025, semestre: 2, valor: 350 });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ erro: 'Já existe uma medição deste indicador em 2025/2' });
  });

  it('edita rascunho só com valor e não permite trocar indicador', async () => {
    dados.atualizarMedicao.mockResolvedValue({ ...medicaoRascunho, valor: 1 });

    const res = await autenticada(request(app).put('/api/admin/medicoes/5'))
      .send({ valor: 1, id_indicador: 999, status: 'publicado' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ...medicaoRascunho, valor: 1 });
    expect(dados.atualizarMedicao).toHaveBeenCalledWith(5, { valor: 1, ano: undefined, semestre: undefined });
  });

  it('aceita somente ano ou semestre na edição para combinar com o outro valor atual', async () => {
    dados.atualizarMedicao.mockResolvedValue({ ...medicaoRascunho, ano: 2026 });

    const res = await autenticada(request(app).put('/api/admin/medicoes/5')).send({ valor: 1, ano: 2026 });

    expect(res.status).toBe(200);
    expect(dados.atualizarMedicao).toHaveBeenCalledWith(5, { valor: 1, ano: 2026, semestre: undefined });
  });

  it('responde 409 para edição publicada e para duplicidade na edição', async () => {
    dados.atualizarMedicao
      .mockResolvedValueOnce({ publicada: true })
      .mockResolvedValueOnce({ conflito: true, ano: 2026, semestre: 1 });

    const publicada = await autenticada(request(app).put('/api/admin/medicoes/5')).send({ valor: 1 });
    const duplicada = await autenticada(request(app).put('/api/admin/medicoes/5'))
      .send({ valor: 1, ano: 2026, semestre: 1 });

    expect(publicada.status).toBe(409);
    expect(publicada.body).toEqual({ erro: 'Despublique a medição antes de editar' });
    expect(duplicada.status).toBe(409);
    expect(duplicada.body).toEqual({ erro: 'Já existe uma medição deste indicador em 2026/1' });
  });

  it('exige token para cadastro', async () => {
    const res = await request(app).post('/api/admin/medicoes')
      .send({ id_indicador: 3, ano: 2025, semestre: 2, valor: 1 });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ erro: 'Token inválido ou expirado' });
    expect(dados.criarMedicao).not.toHaveBeenCalled();
  });
});
