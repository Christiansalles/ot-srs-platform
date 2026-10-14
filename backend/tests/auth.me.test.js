const request = require('supertest');

jest.mock('../src/db', () => ({
  usuario: { findUnique: jest.fn() },
}));

const prisma = require('../src/db');
const app = require('../src/app');
const { criarToken } = require('../src/services/auth');

const usuarioAtivo = {
  id_usuario: 42,
  nome: 'Maria Clara',
  email: 'maria@example.com',
  senha_hash: 'hash-que-nao-deve-aparecer',
  ativo: true,
};

describe('GET /api/auth/me', () => {
  const segredoAnterior = process.env.AUTH_TOKEN_SECRET;

  beforeAll(() => {
    process.env.AUTH_TOKEN_SECRET = 'segredo-de-teste-com-tamanho-suficiente';
  });

  afterAll(() => {
    if (segredoAnterior === undefined) delete process.env.AUTH_TOKEN_SECRET;
    else process.env.AUTH_TOKEN_SECRET = segredoAnterior;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.usuario.findUnique.mockResolvedValue(usuarioAtivo);
  });

  it('valida o token e devolve somente os dados públicos do usuário', async () => {
    const token = criarToken(usuarioAtivo);
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      usuario: {
        id_usuario: 42,
        nome: 'Maria Clara',
        email: 'maria@example.com',
      },
    });
    expect(JSON.stringify(res.body)).not.toContain('senha_hash');
    expect(prisma.usuario.findUnique).toHaveBeenCalledWith({ where: { id_usuario: 42 } });
  });

  it.each([
    ['sem token', undefined],
    ['token inválido', 'nao.e.valido'],
    ['token com conteúdo inválido', 'bnVsbA.e30.assinatura-invalida'],
    ['token expirado', () => criarToken(usuarioAtivo, Math.floor(Date.now() / 1000) - 7200)],
  ])('responde 401 para requisição %s', async (_caso, token) => {
    const tokenParaEnviar = typeof token === 'function' ? token() : token;
    let requisicao = request(app).get('/api/auth/me');
    if (tokenParaEnviar) requisicao = requisicao.set('Authorization', `Bearer ${tokenParaEnviar}`);

    const res = await requisicao;

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ erro: 'Token inválido ou expirado' });
  });

  it('responde 401 se a conta vinculada ao token está inativa', async () => {
    prisma.usuario.findUnique.mockResolvedValue({ ...usuarioAtivo, ativo: false });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${criarToken(usuarioAtivo)}`);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ erro: 'Token inválido ou expirado' });
  });
});
