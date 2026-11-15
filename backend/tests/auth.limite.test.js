const request = require('supertest');
const crypto = require('node:crypto');

jest.mock('../src/db', () => ({
  usuario: { findUnique: jest.fn() },
}));

const senhaCorreta = 'senha-segura-de-teste';
const salt = Buffer.from('salt-de-teste').toString('hex');
const senhaHash = crypto.scryptSync(senhaCorreta, salt, 64).toString('hex');
const usuarioAtivo = {
  id_usuario: 42,
  nome: 'Maria Clara',
  email: 'maria@example.com',
  senha_hash: `${salt}:${senhaHash}`,
  ativo: true,
  perfil: 'administrador',
};
const corpoLogin = { email: 'maria@example.com', senha: senhaCorreta };
const erroLimite = { erro: 'Muitas tentativas de login. Aguarde alguns minutos e tente de novo.' };

describe('limite de tentativas em POST /api/auth/login', () => {
  const ambienteAnterior = {
    JWT_SECRET: process.env.JWT_SECRET,
    LOGIN_MAX_TENTATIVAS: process.env.LOGIN_MAX_TENTATIVAS,
    LOGIN_JANELA_MINUTOS: process.env.LOGIN_JANELA_MINUTOS,
  };
  let app;
  let prisma;

  beforeEach(() => {
    process.env.JWT_SECRET = 'segredo-de-teste-com-tamanho-suficiente';
    process.env.LOGIN_MAX_TENTATIVAS = '5';
    process.env.LOGIN_JANELA_MINUTOS = '15';
    jest.resetModules();
    app = require('../src/app');
    prisma = require('../src/db');
    prisma.usuario.findUnique.mockResolvedValue(null);
  });

  afterEach(() => jest.restoreAllMocks());

  afterAll(() => {
    for (const [nome, valor] of Object.entries(ambienteAnterior)) {
      if (valor === undefined) delete process.env[nome];
      else process.env[nome] = valor;
    }
  });

  async function errarCincoVezes() {
    for (let tentativa = 0; tentativa < 5; tentativa += 1) {
      const resposta = await request(app).post('/api/auth/login').send(corpoLogin);
      expect(resposta.status).toBe(401);
    }
  }

  it('bloqueia a sexta tentativa por IP com 429 em JSON e Retry-After', async () => {
    await errarCincoVezes();

    const resposta = await request(app).post('/api/auth/login').send(corpoLogin);

    expect(resposta.status).toBe(429);
    expect(resposta.headers['content-type']).toMatch(/json/);
    expect(resposta.body).toEqual(erroLimite);
    expect(Number(resposta.headers['retry-after'])).toBeGreaterThan(0);
    expect(Number(resposta.headers['retry-after'])).toBeLessThanOrEqual(15 * 60);
    expect(prisma.usuario.findUnique).toHaveBeenCalledTimes(5);
  });

  it('usa o limite configurado nas variáveis de ambiente', async () => {
    process.env.LOGIN_MAX_TENTATIVAS = '2';
    process.env.LOGIN_JANELA_MINUTOS = '1';
    jest.resetModules();
    app = require('../src/app');
    prisma = require('../src/db');
    prisma.usuario.findUnique.mockResolvedValue(null);

    for (let tentativa = 0; tentativa < 2; tentativa += 1) {
      expect((await request(app).post('/api/auth/login').send(corpoLogin)).status).toBe(401);
    }
    const bloqueio = await request(app).post('/api/auth/login').send(corpoLogin);
    expect(bloqueio.status).toBe(429);
    expect(Number(bloqueio.headers['retry-after'])).toBeLessThanOrEqual(60);
  });

  it('permite login certo depois de quatro erros, sem apagar as tentativas erradas', async () => {
    for (let tentativa = 0; tentativa < 4; tentativa += 1) {
      expect((await request(app).post('/api/auth/login').send(corpoLogin)).status).toBe(401);
    }

    prisma.usuario.findUnique.mockResolvedValueOnce(usuarioAtivo);
    const sucesso = await request(app).post('/api/auth/login').send(corpoLogin);
    expect(sucesso.status).toBe(200);

    expect((await request(app).post('/api/auth/login').send(corpoLogin)).status).toBe(401);
    prisma.usuario.findUnique.mockResolvedValueOnce(usuarioAtivo);
    const bloqueio = await request(app).post('/api/auth/login').send(corpoLogin);
    expect(bloqueio.status).toBe(429);
    expect(bloqueio.body).toEqual(erroLimite);
  });

  it('libera novas tentativas quando a janela termina', async () => {
    let agora = Date.now();
    jest.spyOn(Date, 'now').mockImplementation(() => agora);
    await errarCincoVezes();
    expect((await request(app).post('/api/auth/login').send(corpoLogin)).status).toBe(429);

    agora += 15 * 60 * 1000 + 1;
    const novaTentativa = await request(app).post('/api/auth/login').send(corpoLogin);
    expect(novaTentativa.status).toBe(401);
  });

  it('não limita outras rotas depois de bloquear o login', async () => {
    await errarCincoVezes();

    for (let tentativa = 0; tentativa < 6; tentativa += 1) {
      expect((await request(app).get('/api/health')).status).toBe(200);
      expect((await request(app).get('/api/auth/me')).status).toBe(401);
    }
    expect((await request(app).post('/api/auth/login').send(corpoLogin)).status).toBe(429);
  });

  it('conta também JSON inválido como erro 400', async () => {
    for (let tentativa = 0; tentativa < 5; tentativa += 1) {
      const resposta = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{');
      expect(resposta.status).toBe(400);
    }

    expect((await request(app).post('/api/auth/login').send(corpoLogin)).status).toBe(429);
    expect(prisma.usuario.findUnique).not.toHaveBeenCalled();
  });

  it('não conta erro interno 500 como tentativa errada', async () => {
    prisma.usuario.findUnique.mockResolvedValue(usuarioAtivo);
    delete process.env.JWT_SECRET;

    for (let tentativa = 0; tentativa < 6; tentativa += 1) {
      expect((await request(app).post('/api/auth/login').send(corpoLogin)).status).toBe(500);
    }

    process.env.JWT_SECRET = 'segredo-de-teste-com-tamanho-suficiente';
    expect((await request(app).post('/api/auth/login').send(corpoLogin)).status).toBe(200);
  });
});
