const request = require('supertest');
const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');

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
  perfil: 'administrador',
};

describe('POST /api/auth/login', () => {
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

  it('autentica e devolve token e somente os dados públicos do usuário', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'MARIA@example.com', senha: senhaCorreta });

    expect(res.status).toBe(200);
    expect(res.body.usuario).toEqual({
      id: 42,
      nome: 'Maria Clara',
      email: 'maria@example.com',
      perfil: 'administrador',
    });
    expect(Object.keys(res.body).sort()).toEqual(['token', 'usuario']);
    const claims = jwt.verify(res.body.token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    expect(claims.exp - claims.iat).toBe(8 * 60 * 60);
    expect(claims).not.toHaveProperty('perfil');
    expect(claims).not.toHaveProperty('role');
    expect(JSON.stringify(res.body)).not.toContain('senha_hash');
    expect(prisma.usuario.findUnique).toHaveBeenCalledWith({
      where: { email: 'maria@example.com' },
    });

    const resMe = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${res.body.token}`);
    expect(resMe.status).toBe(200);
    expect(resMe.body).toEqual({
      id: 42,
      nome: 'Maria Clara',
      email: 'maria@example.com',
      perfil: 'administrador',
    });
    expect(JSON.stringify(resMe.body)).not.toContain('senha_hash');
  });

  it('devolve o perfil de editor para quem entra como editor', async () => {
    prisma.usuario.findUnique.mockResolvedValue({ ...usuarioAtivo, perfil: 'editor' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'maria@example.com', senha: senhaCorreta });

    expect(res.status).toBe(200);
    expect(res.body.usuario.perfil).toBe('editor');
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

  it('devolve 500 em JSON se JWT_SECRET estiver ausente sem derrubar a API', async () => {
    const segredo = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;

    try {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'maria@example.com', senha: senhaCorreta });
      const health = await request(app).get('/api/health');

      expect(res.status).toBe(500);
      expect(res.headers['content-type']).toMatch(/json/);
      expect(res.body).toEqual({ erro: 'Erro interno do servidor' });
      expect(health.status).toBe(200);
    } finally {
      process.env.JWT_SECRET = segredo;
    }
  });
});
