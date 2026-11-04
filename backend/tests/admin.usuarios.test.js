// Teste de integração: /api/admin/usuarios contra o Postgres, sem mock.
// Cria os próprios usuários, com e-mail único por execução, e apaga tudo no fim.

const request = require('supertest');
const prisma = require('../src/db');
const app = require('../src/app');
const { criarToken } = require('../src/services/auth');
const { gerarHash } = require('../src/services/senha');

const sufixo = `usuarios-${Date.now()}`;
const emailDe = (nome) => `${nome}-${sufixo}@teste.com`;
const SENHA = 'senha-de-teste-123';
const ERRO_PERFIL = { erro: 'Só o administrador gerencia usuários' };
const ERRO_TOKEN = { erro: 'Token inválido ou expirado' };
const ERRO_CAMPOS = { erro: 'Campos obrigatórios inválidos' };

const segredoAnterior = process.env.JWT_SECRET;
let admin;
let editor;
const tokens = {};

function corpoNovo(nome, extra = {}) {
  return { nome: `Usuário ${nome}`, email: emailDe(nome), senha: SENHA, perfil: 'editor', ...extra };
}

const comToken = (requisicao, token = tokens.admin) => requisicao.set('Authorization', `Bearer ${token}`);
const listar = (token) => comToken(request(app).get('/api/admin/usuarios'), token);
const criar = (corpo, token) => comToken(request(app).post('/api/admin/usuarios').send(corpo), token);
const alterar = (id, corpo, token) => comToken(request(app).patch(`/api/admin/usuarios/${id}`).send(corpo), token);
const entrar = (email, senha = SENHA) => request(app).post('/api/auth/login').send({ email, senha });

beforeAll(async () => {
  process.env.JWT_SECRET = segredoAnterior || 'segredo-de-teste-com-tamanho-suficiente';

  const senha_hash = await gerarHash(SENHA);
  admin = await prisma.usuario.create({
    data: { nome: 'Admin', email: emailDe('admin'), senha_hash, ativo: true, perfil: 'administrador' },
  });
  editor = await prisma.usuario.create({
    data: { nome: 'Editor', email: emailDe('editor'), senha_hash, ativo: true, perfil: 'editor' },
  });
  tokens.admin = criarToken(admin);
  tokens.editor = criarToken(editor);
});

afterAll(async () => {
  await prisma.usuario.deleteMany({ where: { email: { endsWith: `-${sufixo}@teste.com` } } });
  process.env.JWT_SECRET = segredoAnterior;
  await prisma.$disconnect();
});

describe('acesso às rotas de usuários', () => {
  test.each([
    ['GET', () => request(app).get('/api/admin/usuarios')],
    ['POST', () => request(app).post('/api/admin/usuarios').send(corpoNovo('sem-token'))],
    ['PATCH', () => request(app).patch(`/api/admin/usuarios/${editor.id_usuario}`).send({ nome: 'X' })],
  ])('%s sem token responde 401', async (_metodo, chamar) => {
    const resposta = await chamar();
    expect(resposta.status).toBe(401);
    expect(resposta.body).toEqual(ERRO_TOKEN);
  });

  test.each([
    ['GET', () => listar(tokens.editor)],
    ['POST', () => criar(corpoNovo('pelo-editor'), tokens.editor)],
    ['PATCH', () => alterar(admin.id_usuario, { perfil: 'editor' }, tokens.editor)],
  ])('%s com o editor responde 403 com a mensagem própria', async (_metodo, chamar) => {
    const resposta = await chamar();
    expect(resposta.status).toBe(403);
    expect(resposta.body).toEqual(ERRO_PERFIL);
  });

  test('o editor não consegue criar usuário nem pelo corpo', async () => {
    await criar(corpoNovo('pelo-editor'), tokens.editor);
    expect(await prisma.usuario.findUnique({ where: { email: emailDe('pelo-editor') } })).toBeNull();
  });

  test('não existe DELETE: responde 404 e o usuário continua no banco', async () => {
    const resposta = await comToken(request(app).delete(`/api/admin/usuarios/${editor.id_usuario}`));
    expect(resposta.status).toBe(404);
    expect(await prisma.usuario.findUnique({ where: { id_usuario: editor.id_usuario } })).not.toBeNull();
  });
});

describe('GET /api/admin/usuarios', () => {
  test('lista ativos e desativados em ordem de nome, sem senha_hash', async () => {
    const desativado = await prisma.usuario.create({
      data: { nome: 'Aaa desativado', email: emailDe('desativado'), senha_hash: 'x', ativo: false, perfil: 'editor' },
    });

    const resposta = await listar();

    expect(resposta.status).toBe(200);
    const nomes = resposta.body.map((usuario) => usuario.nome);
    expect(nomes).toEqual([...nomes].sort((a, b) => a.localeCompare(b, 'pt-BR')));
    expect(resposta.body).toContainEqual({
      id: desativado.id_usuario, nome: 'Aaa desativado', email: emailDe('desativado'), perfil: 'editor', ativo: false,
    });
    expect(resposta.body).toContainEqual({
      id: admin.id_usuario, nome: 'Admin', email: emailDe('admin'), perfil: 'administrador', ativo: true,
    });
    for (const usuario of resposta.body) {
      expect(Object.keys(usuario).sort()).toEqual(['ativo', 'email', 'id', 'nome', 'perfil']);
    }
  });
});

describe('POST /api/admin/usuarios', () => {
  test('cria ativo, guarda a senha com hash e responde 201 sem senha_hash', async () => {
    const resposta = await criar(corpoNovo('novo', { nome: '  Novo Editor  ', email: `  ${emailDe('NOVO').toUpperCase()} ` }));

    expect(resposta.status).toBe(201);
    expect(resposta.body).toEqual({
      id: expect.any(Number), nome: 'Novo Editor', email: emailDe('novo'), perfil: 'editor', ativo: true,
    });

    const salvo = await prisma.usuario.findUnique({ where: { id_usuario: resposta.body.id } });
    expect(salvo.senha_hash).not.toBe(SENHA);
    expect(salvo.senha_hash).toMatch(/^[a-f\d]{32}:[a-f\d]{128}$/);

    const login = await entrar(emailDe('novo'));
    expect(login.status).toBe(200);
    expect(login.body.usuario.perfil).toBe('editor');
  });

  test('ignora ativo e campos desconhecidos no cadastro', async () => {
    const resposta = await criar(corpoNovo('ignora', { ativo: false, senha_hash: 'x', id_usuario: 1 }));

    expect(resposta.status).toBe(201);
    expect(resposta.body.ativo).toBe(true);
    expect(resposta.body.id).not.toBe(1);
  });

  test('e-mail repetido, inclusive com maiúsculas, responde 409', async () => {
    const resposta = await criar(corpoNovo('repetido', { email: emailDe('editor').toUpperCase() }));

    expect(resposta.status).toBe(409);
    expect(resposta.body).toEqual({ erro: 'Já existe um usuário com este e-mail' });
  });

  test.each([
    ['sem nome', { nome: undefined }, ERRO_CAMPOS],
    ['sem e-mail', { email: undefined }, ERRO_CAMPOS],
    ['sem senha', { senha: undefined }, ERRO_CAMPOS],
    ['sem perfil', { perfil: undefined }, ERRO_CAMPOS],
    ['nome vazio', { nome: '   ' }, ERRO_CAMPOS],
    ['nome com mais de 80 caracteres', { nome: 'a'.repeat(81) }, ERRO_CAMPOS],
    ['nome que não é texto', { nome: 123 }, ERRO_CAMPOS],
    ['e-mail com mais de 120 caracteres', { email: `${'a'.repeat(115)}@x.com` }, ERRO_CAMPOS],
    ['e-mail sem @', { email: 'sem-arroba.com' }, { erro: 'E-mail inválido' }],
    ['e-mail sem domínio', { email: 'nome@local' }, { erro: 'E-mail inválido' }],
    ['senha curta', { senha: '1234567' }, { erro: 'A senha deve ter pelo menos 8 caracteres' }],
    ['senha que não é texto', { senha: 12345678 }, ERRO_CAMPOS],
    ['perfil desconhecido', { perfil: 'homologador' }, { erro: 'Perfil inválido' }],
  ])('%s responde 400', async (nome, extra, erro) => {
    const corpo = corpoNovo(`invalido-${nome.replaceAll(' ', '-')}`, extra);
    const resposta = await criar(corpo);

    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual(erro);
  });

  test('corpo que não é JSON válido responde 400', async () => {
    const resposta = await comToken(request(app).post('/api/admin/usuarios'))
      .set('Content-Type', 'application/json')
      .send('{"nome":');

    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual({ erro: 'JSON inválido' });
  });
});

describe('PATCH /api/admin/usuarios/:id', () => {
  let alvo;
  let tokenAlvo;

  beforeEach(async () => {
    await prisma.usuario.deleteMany({ where: { email: emailDe('alvo') } });
    alvo = await prisma.usuario.create({
      data: {
        nome: 'Alvo', email: emailDe('alvo'), senha_hash: await gerarHash(SENHA), ativo: true, perfil: 'editor',
      },
    });
    tokenAlvo = criarToken(alvo);
  });

  test('altera só os campos enviados', async () => {
    const resposta = await alterar(alvo.id_usuario, { nome: 'Alvo Renomeado' });

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({
      id: alvo.id_usuario, nome: 'Alvo Renomeado', email: emailDe('alvo'), perfil: 'editor', ativo: true,
    });
  });

  test('desativado não entra mais, nem com o token antigo', async () => {
    const resposta = await alterar(alvo.id_usuario, { ativo: false });
    expect(resposta.status).toBe(200);
    expect(resposta.body.ativo).toBe(false);

    const login = await entrar(emailDe('alvo'));
    expect(login.status).toBe(401);
    expect(login.body).toEqual({ erro: 'E-mail ou senha inválidos' });

    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${tokenAlvo}`);
    expect(me.status).toBe(401);
  });

  test('reativado volta a entrar', async () => {
    await alterar(alvo.id_usuario, { ativo: false });
    const resposta = await alterar(alvo.id_usuario, { ativo: true });

    expect(resposta.status).toBe(200);
    expect((await entrar(emailDe('alvo'))).status).toBe(200);
  });

  test('a troca de perfil vale na próxima requisição, com o mesmo token', async () => {
    expect((await listar(tokenAlvo)).status).toBe(403);

    await alterar(alvo.id_usuario, { perfil: 'administrador' });
    expect((await listar(tokenAlvo)).status).toBe(200);

    await alterar(alvo.id_usuario, { perfil: 'editor' });
    expect((await listar(tokenAlvo)).status).toBe(403);
  });

  test('redefinir a senha troca a senha do login', async () => {
    const resposta = await alterar(alvo.id_usuario, { senha: 'senha-nova-456' });
    expect(resposta.status).toBe(200);
    expect(resposta.body).not.toHaveProperty('senha_hash');

    expect((await entrar(emailDe('alvo'))).status).toBe(401);
    expect((await entrar(emailDe('alvo'), 'senha-nova-456')).status).toBe(200);
  });

  test('e-mail de outro usuário responde 409', async () => {
    const resposta = await alterar(alvo.id_usuario, { email: emailDe('editor') });

    expect(resposta.status).toBe(409);
    expect(resposta.body).toEqual({ erro: 'Já existe um usuário com este e-mail' });
  });

  test.each([
    ['desativar', { ativo: false }],
    ['rebaixar para editor', { perfil: 'editor' }],
  ])('o administrador não pode %s a si mesmo: 409', async (_acao, corpo) => {
    const resposta = await alterar(admin.id_usuario, corpo);

    expect(resposta.status).toBe(409);
    expect(resposta.body).toEqual({ erro: 'Você não pode desativar nem rebaixar o próprio usuário' });
    const salvo = await prisma.usuario.findUnique({ where: { id_usuario: admin.id_usuario } });
    expect(salvo).toMatchObject({ ativo: true, perfil: 'administrador' });
  });

  test('o administrador pode mudar o próprio nome', async () => {
    const resposta = await alterar(admin.id_usuario, { nome: 'Admin', perfil: 'administrador', ativo: true });
    expect(resposta.status).toBe(200);
  });

  test.each(['999999999', 'abc', '0', '-1', '1.5'])('id %s responde 404', async (id) => {
    const resposta = await alterar(id, { nome: 'X' });

    expect(resposta.status).toBe(404);
    expect(resposta.body).toEqual({ erro: 'Recurso não encontrado' });
  });

  test.each([
    ['corpo vazio', {}, ERRO_CAMPOS],
    ['só campos desconhecidos', { cargo: 'chefe' }, ERRO_CAMPOS],
    ['ativo que não é booleano', { ativo: 'false' }, ERRO_CAMPOS],
    ['nome vazio', { nome: '' }, ERRO_CAMPOS],
    ['e-mail inválido', { email: 'sem-arroba' }, { erro: 'E-mail inválido' }],
    ['senha curta', { senha: 'curta' }, { erro: 'A senha deve ter pelo menos 8 caracteres' }],
    ['perfil desconhecido', { perfil: 'comtur' }, { erro: 'Perfil inválido' }],
  ])('%s responde 400 sem mudar nada', async (_nome, corpo, erro) => {
    const resposta = await alterar(alvo.id_usuario, corpo);

    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual(erro);
    const salvo = await prisma.usuario.findUnique({ where: { id_usuario: alvo.id_usuario } });
    expect(salvo).toMatchObject({ nome: 'Alvo', email: emailDe('alvo'), perfil: 'editor', ativo: true });
  });
});
