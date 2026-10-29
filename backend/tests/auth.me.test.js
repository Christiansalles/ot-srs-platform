const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../src/db', () => ({
  usuario: { findUnique: jest.fn() },
}));

const prisma = require('../src/db');
const app = require('../src/app');

const usuarioAtivo = {
  id_usuario: 42,
  nome: 'Maria Clara',
  email: 'maria@example.com',
  senha_hash: 'hash-que-nao-deve-aparecer',
  ativo: true,
  perfil: 'administrador',
};

describe('GET /api/auth/me', () => {
  const segredoAnterior = process.env.JWT_SECRET;

  beforeAll(() => {
    process.env.JWT_SECRET = 'segredo-de-teste-com-tamanho-suficiente';
  });

  afterAll(() => {
    if (segredoAnterior === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = segredoAnterior;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.usuario.findUnique.mockResolvedValue(usuarioAtivo);
  });

  function criarToken(sub = '42', opcoes = {}) {
    return jwt.sign(
      { email: usuarioAtivo.email },
      process.env.JWT_SECRET,
      { algorithm: 'HS256', subject: sub, expiresIn: '8h', ...opcoes },
    );
  }

  it('valida o token e devolve somente os dados públicos do usuário', async () => {
    const token = criarToken();
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id: 42,
      nome: 'Maria Clara',
      email: 'maria@example.com',
      perfil: 'administrador',
    });
    expect(JSON.stringify(res.body)).not.toContain('senha_hash');
    expect(prisma.usuario.findUnique).toHaveBeenCalledWith({ where: { id_usuario: 42 } });
  });

  it('devolve o perfil lido do banco, mesmo que tenha mudado depois do login', async () => {
    const token = criarToken();
    prisma.usuario.findUnique.mockResolvedValue({ ...usuarioAtivo, perfil: 'editor' });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.perfil).toBe('editor');
  });

  it.each([
    ['sem token', undefined],
    ['token inválido', 'nao.e.valido'],
    ['token com conteúdo inválido', 'bnVsbA.e30.assinatura-invalida'],
    ['token expirado', () => criarToken('42', { expiresIn: '-1s' })],
    ['token com algoritmo none', () => jwt.sign({ email: usuarioAtivo.email, sub: '42' }, '', { algorithm: 'none', expiresIn: '8h' })],
  ])('responde 401 para requisição %s', async (_caso, token) => {
    const tokenParaEnviar = typeof token === 'function' ? token() : token;
    let requisicao = request(app).get('/api/auth/me');
    if (tokenParaEnviar) requisicao = requisicao.set('Authorization', `Bearer ${tokenParaEnviar}`);

    const res = await requisicao;

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ erro: 'Token inválido ou expirado' });
  });

  it('rejeita um token válido que teve o sub adulterado', async () => {
    const tokenValido = criarToken();
    const [cabecalho, payload] = tokenValido.split('.');
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    claims.sub = '43';
    const payloadAdulterado = Buffer.from(JSON.stringify(claims)).toString('base64url');
    const tokenAdulterado = `${cabecalho}.${payloadAdulterado}.${tokenValido.split('.')[2]}`;

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${tokenAdulterado}`);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ erro: 'Token inválido ou expirado' });
    expect(prisma.usuario.findUnique).not.toHaveBeenCalled();
  });

  it('responde 401 se a conta vinculada ao token está inativa', async () => {
    prisma.usuario.findUnique.mockResolvedValue({ ...usuarioAtivo, ativo: false });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${criarToken()}`);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ erro: 'Token inválido ou expirado' });
  });
});
