// Integração da E12 contra o PostgreSQL: cadastro, duplicidade e publicação
// de medição por um editor.
const request = require('supertest');
const prisma = require('../src/db');
const app = require('../src/app');
const { criarToken } = require('../src/services/auth');

const sufixo = `e12-${Date.now()}`;
const ano = 3000 + (Date.now() % 1000);
let usuario;
let administrador;
let setor;
let indicador;
let medicao;
let token;
let tokenAdministrador;
const segredoAnterior = process.env.JWT_SECRET;

beforeAll(async () => {
  process.env.JWT_SECRET = segredoAnterior || 'segredo-de-teste-com-tamanho-suficiente';
  usuario = await prisma.usuario.create({
    data: { nome: 'Editora E12', email: `${sufixo}@teste.com`, senha_hash: 'x', ativo: true, perfil: 'editor' },
  });
  token = criarToken(usuario);
  administrador = await prisma.usuario.create({
    data: { nome: 'Admin E12', email: `admin-${sufixo}@teste.com`, senha_hash: 'x', ativo: true, perfil: 'administrador' },
  });
  tokenAdministrador = criarToken(administrador);
  setor = await prisma.setor.create({ data: { nome: `Setor ${sufixo}` } });
});

afterAll(async () => {
  if (indicador) {
    await prisma.medicao.deleteMany({ where: { id_indicador: indicador.id_indicador } });
    await prisma.indicador.delete({ where: { id_indicador: indicador.id_indicador } });
  }
  if (setor) await prisma.setor.delete({ where: { id_setor: setor.id_setor } });
  await prisma.usuario.deleteMany({ where: { id_usuario: { in: [usuario?.id_usuario, administrador?.id_usuario].filter(Boolean) } } });
  await prisma.periodo.deleteMany({ where: { ano } });
  await prisma.$disconnect();
  if (segredoAnterior === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = segredoAnterior;
});

const autenticada = (requisicao) => requisicao.set('Authorization', `Bearer ${token}`);

// atualizado_em tem precisão de milissegundo; a pausa garante que a próxima
// alteração caia num instante diferente.
const esperar = () => new Promise((resolver) => { setTimeout(resolver, 10); });

async function medicaoNoPainel() {
  const resposta = await autenticada(request(app).get(`/api/admin/indicadores?setor=${setor.id_setor}`));
  expect(resposta.status).toBe(200);
  return resposta.body[0].medicoes[0];
}

let atualizadoNoCadastro;
let atualizadoNaEdicao;

describe('cadastro e edição de indicador e medição (E12)', () => {
  it('permite ao editor cadastrar e editar um indicador', async () => {
    const cadastroIndicador = await autenticada(request(app).post('/api/admin/indicadores'))
      .send({ id_setor: setor.id_setor, nome: `Indicador ${sufixo}`, unidade: 'un' });
    expect(cadastroIndicador.status).toBe(201);
    indicador = await prisma.indicador.findUnique({ where: { id_indicador: cadastroIndicador.body.id } });

    const edicao = await autenticada(request(app).put(`/api/admin/indicadores/${indicador.id_indicador}`))
      .send({ id_setor: setor.id_setor, nome: `Indicador editado ${sufixo}`, unidade: 'un', descricao: 'Editado pelo editor' });
    expect(edicao.status).toBe(200);
    expect(edicao.body).toMatchObject({ nome: `Indicador editado ${sufixo}`, descricao: 'Editado pelo editor' });
  });

  it('cria o período, cadastra medição em rascunho e responde 409 sem duplicar', async () => {
    const periodoAntes = await request(app).get('/api/periodos');
    expect(periodoAntes.body.map(({ ano: a }) => a)).not.toContain(ano);

    const corpo = { id_indicador: indicador.id_indicador, ano, semestre: 1, valor: 12 };
    const cadastroMedicao = await autenticada(request(app).post('/api/admin/medicoes')).send(corpo);
    expect(cadastroMedicao.status).toBe(201);
    expect(cadastroMedicao.body).toMatchObject({ ano, semestre: 1, valor: 12, status: 'rascunho' });
    medicao = cadastroMedicao.body;

    const noPainel = await medicaoNoPainel();
    expect(noPainel).toMatchObject({ id: medicao.id, lancado_por: 'Editora E12' });
    expect(noPainel.atualizado_em).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(noPainel).not.toHaveProperty('id_usuario');
    atualizadoNoCadastro = noPainel.atualizado_em;

    const atualizacaoRascunho = await request(app).get(`/api/indicadores/atualizacao?setor=${setor.id_setor}`);
    expect(atualizacaoRascunho.body).toEqual({ atualizado_em: null });

    const duplicada = await autenticada(request(app).post('/api/admin/medicoes')).send(corpo);
    expect(duplicada.status).toBe(409);
    expect(duplicada.body).toEqual({ erro: `Já existe uma medição deste indicador em ${ano}/1` });
    expect(await prisma.medicao.count({ where: { id_indicador: indicador.id_indicador } })).toBe(1);

    const publicosAntes = await request(app).get(`/api/indicadores?setor=${setor.id_setor}`);
    expect(publicosAntes.body).toEqual([]);
    const periodosRascunho = await request(app).get('/api/periodos');
    expect(periodosRascunho.body.map(({ ano: a }) => a)).not.toContain(ano);
  });

  it('permite editar a medição enquanto ela está em rascunho', async () => {
    await esperar();
    const edicao = await autenticada(request(app).put(`/api/admin/medicoes/${medicao.id}`)).send({ valor: 13 });
    expect(edicao.status).toBe(200);
    expect(edicao.body).toMatchObject({ valor: 13, status: 'rascunho' });

    const noPainel = await medicaoNoPainel();
    expect(new Date(noPainel.atualizado_em).getTime()).toBeGreaterThan(new Date(atualizadoNoCadastro).getTime());
    atualizadoNaEdicao = noPainel.atualizado_em;
  });

  it('bloqueia edição publicada e expõe a medição e o período após publicar', async () => {
    await esperar();
    const publicada = await request(app).patch(`/api/admin/medicoes/${medicao.id}/status`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ status: 'publicado' });
    expect(publicada.status).toBe(200);

    // Publicar muda a data, mas quem lançou continua sendo a editora, não o administrador.
    const noPainel = await medicaoNoPainel();
    expect(noPainel.lancado_por).toBe('Editora E12');
    expect(new Date(noPainel.atualizado_em).getTime()).toBeGreaterThan(new Date(atualizadoNaEdicao).getTime());
    const atualizacaoPublica = await request(app).get(`/api/indicadores/atualizacao?setor=${setor.id_setor}`);
    expect(atualizacaoPublica.body).toEqual({ atualizado_em: noPainel.atualizado_em });

    const edicaoPublicada = await autenticada(request(app).put(`/api/admin/medicoes/${medicao.id}`))
      .send({ valor: 14 });
    expect(edicaoPublicada.status).toBe(409);
    expect(edicaoPublicada.body).toEqual({ erro: 'Despublique a medição antes de editar' });

    const publicosDepois = await request(app).get(`/api/indicadores?setor=${setor.id_setor}`);
    expect(publicosDepois.body).toHaveLength(1);
    expect(publicosDepois.body[0].medicoes).toEqual([{ ano, semestre: 1, valor: 13 }]);
    const periodosPublicados = await request(app).get('/api/periodos');
    expect(periodosPublicados.body).toContainEqual(expect.objectContaining({ ano, semestre: 1 }));
  });

  it('responde 401 sem token', async () => {
    const resposta = await request(app).post('/api/admin/medicoes')
      .send({ id_indicador: 1, ano, semestre: 2, valor: 1 });
    expect(resposta.status).toBe(401);
    expect(resposta.body).toEqual({ erro: 'Token inválido ou expirado' });
  });
});
