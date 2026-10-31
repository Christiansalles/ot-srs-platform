const request = require('supertest');

jest.mock('../src/services/dados');
jest.mock('../src/services/auth', () => ({
  buscarUsuarioAutenticado: jest.fn(),
  ERRO_TOKEN: 'Token inválido ou expirado',
}));

const dados = require('../src/services/dados');
const { buscarUsuarioAutenticado } = require('../src/services/auth');
const app = require('../src/app');

const indicadoresAdmin = [
  {
    id: 1,
    nome: 'Leitos',
    unidade: 'leitos',
    descricao: null,
    setor: { id: 1, nome: 'Hospedagem' },
    medicoes: [
      { id: 7, ano: 2025, semestre: 2, valor: 350, status: 'rascunho' },
      { id: 6, ano: 2025, semestre: 1, valor: 312, status: 'publicado' },
    ],
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  buscarUsuarioAutenticado.mockResolvedValue({ id: 12, nome: 'Admin', email: 'admin@example.com' });
  dados.buscarIndicadoresAdmin.mockResolvedValue(indicadoresAdmin);
});

describe('GET /api/admin/indicadores', () => {
  it('exige autenticação e responde 401 sem token', async () => {
    const res = await request(app).get('/api/admin/indicadores');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ erro: 'Token inválido ou expirado' });
    expect(dados.buscarIndicadoresAdmin).not.toHaveBeenCalled();
  });

  it('responde 401 quando o token não é reconhecido', async () => {
    buscarUsuarioAutenticado.mockResolvedValueOnce(null);

    const res = await request(app)
      .get('/api/admin/indicadores')
      .set('Authorization', 'Bearer token-invalido');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ erro: 'Token inválido ou expirado' });
    expect(dados.buscarIndicadoresAdmin).not.toHaveBeenCalled();
  });

  it('devolve todas as medições, inclusive rascunho e publicada, no formato do contrato', async () => {
    const res = await request(app)
      .get('/api/admin/indicadores')
      .set('Authorization', 'Bearer token-valido');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(indicadoresAdmin);
    expect(buscarUsuarioAutenticado).toHaveBeenCalledWith('token-valido');
    expect(dados.buscarIndicadoresAdmin).toHaveBeenCalledWith({ setorId: undefined, status: undefined });
  });

  it('converte os filtros válidos e os envia para a consulta administrativa', async () => {
    const res = await request(app)
      .get('/api/admin/indicadores?setor=1&status=rascunho')
      .set('Authorization', 'Bearer token-valido');

    expect(res.status).toBe(200);
    expect(dados.buscarIndicadoresAdmin).toHaveBeenCalledWith({ setorId: 1, status: 'rascunho' });
  });

  it.each(['abc', '1.5', '-1', '0', ''])('rejeita setor inválido (%p)', async (setor) => {
    const res = await request(app)
      .get(`/api/admin/indicadores?setor=${setor}`)
      .set('Authorization', 'Bearer token-valido');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ erro: 'setor deve ser um número inteiro positivo' });
    expect(dados.buscarIndicadoresAdmin).not.toHaveBeenCalled();
  });

  it.each(['invalido', 'Publicado', ''])('rejeita status inválido (%p)', async (status) => {
    const res = await request(app)
      .get(`/api/admin/indicadores?status=${status}`)
      .set('Authorization', 'Bearer token-valido');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ erro: 'Status inválido' });
    expect(dados.buscarIndicadoresAdmin).not.toHaveBeenCalled();
  });

  it('rejeita status repetido na URL', async () => {
    const res = await request(app)
      .get('/api/admin/indicadores?status=rascunho&status=publicado')
      .set('Authorization', 'Bearer token-valido');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ erro: 'Status inválido' });
  });
});
