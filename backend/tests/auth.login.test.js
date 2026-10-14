const request = require('supertest');
const crypto = require('node:crypto');

jest.mock('../src/db', () => ({
  usuario: { findUnique: jest.fn() },
}));

const prisma = require('../src/db');
const app = require('../src/app');

const senhaCorreta = 'senha-segura-de-teste';
const salt = Buffer.from('salt-de-teste').toString('hex');
const hash = crypto.scryptSync(senhaCorreta, salt, 64).toString('hex');
const usuarioAtivo = {
  id_usuario: 42,
  nome: 'Maria Clara',
  email: 'maria@example.com',
  senha_hash: `${salt}:${hash}`,
  ativo: true,
};

describe('POST /api/auth/login', () => {
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

  it('autentica e devolve token e somente os dados públicos do usuário', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'MARIA@example.com', senha: senhaCorreta });

    expect(res.status).toBe(200);
    expect(res.body.usuario).toEqual({
      id_usuario: 42,
      nome: 'Maria Clara',
      email: 'maria@example.com',
    });
    expect(Object.keys(res.body).sort()).toEqual(['token', 'usuario']);
    const [, payloadToken] = res.body.token.split('.');
    const claims = JSON.parse(Buffer.from(payloadToken, 'base64url').toString('utf8'));
    expect(claims).not.toHaveProperty('perfil');
    expect(claims).not.toHaveProperty('role');
    expect(JSON.stringify(res.body)).not.toContain('senha_hash');
    expect(prisma.usuario.findUnique).toHaveBeenCalledWith({
      where: { email: 'maria@example.com' },
    });
  });

  it.each([
    ['e-mail inexistente', null],
    ['senha incorreta', { ...usuarioAtivo, senha_hash: `${salt}:${crypto.scryptSync('outra-senha', salt, 64).toString('hex')}` }],
    ['usuário inativo', { ...usuarioAtivo, ativo: false }],
  ])('devolve o mesmo 401 para %s', async (_caso, usuario) => {
    prisma.usuario.findUnique.mockResolvedValue(usuario);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'maria@example.com', senha: senhaCorreta });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ erro: 'E-mail ou senha inválidos' });
  });

  it('devolve 400 quando e-mail ou senha não foram informados', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'maria@example.com' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ erro: 'E-mail e senha são obrigatórios' });
    expect(prisma.usuario.findUnique).not.toHaveBeenCalled();
  });
});
