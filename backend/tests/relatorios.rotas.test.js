// Teste de integração: GET /api/relatorios contra o Postgres, sem mock.
// Cria os próprios relatórios em anos fora do seed (2095 e 2096) para não
// depender dos PDFs ilustrativos nem colidir com outros testes.

const request = require('supertest');
const prisma = require('../src/db');
const app = require('../src/app');

const sufixo = `relatorios-${Date.now()}`;
const ANO_ANTIGO = 2095;
const ANO_RECENTE = 2096;

let usuario;
const ids = {};

function relatorio(chave, { data, categoria, status, tamanho_kb = 120 }) {
  return {
    id_usuario: usuario.id_usuario,
    titulo: `Relatório ${chave} ${sufixo}`,
    edicao: data.slice(0, 7),
    categoria,
    data_publicacao: new Date(`${data}T00:00:00.000Z`),
    descricao: `Descrição ${chave}`,
    arquivo_url: `${sufixo}-${chave}.pdf`,
    tamanho_kb,
    status,
  };
}

beforeAll(async () => {
  usuario = await prisma.usuario.create({
    data: { nome: 'Teste relatórios', email: `${sufixo}@teste.com`, senha_hash: 'x', ativo: false },
  });

  const criar = async (chave, campos) => {
    const criado = await prisma.relatorio.create({ data: relatorio(chave, campos) });
    ids[chave] = criado.id_relatorio;
  };
  await criar('hoteleiroAntigo', { data: `${ANO_ANTIGO}-03-10`, categoria: 'Setor Hoteleiro', status: 'publicado' });
  await criar('demandaAntigo', { data: `${ANO_ANTIGO}-11-30`, categoria: 'Perfil de Demanda', status: 'publicado' });
  await criar('hoteleiroRecente', { data: `${ANO_RECENTE}-01-01`, categoria: 'Setor Hoteleiro', status: 'publicado', tamanho_kb: null });
  await criar('impactoRecente', { data: `${ANO_RECENTE}-12-31`, categoria: 'Impacto Econômico', status: 'publicado' });
  await criar('rascunhoRecente', { data: `${ANO_RECENTE}-06-15`, categoria: 'Setor Hoteleiro', status: 'rascunho' });
}, 15000);

afterAll(async () => {
  if (usuario) {
    await prisma.relatorio.deleteMany({ where: { id_usuario: usuario.id_usuario } });
    await prisma.usuario.delete({ where: { id_usuario: usuario.id_usuario } });
  }
  await prisma.$disconnect();
}, 15000);

const idsDaResposta = (body) => body.map((item) => item.id);

describe('GET /api/relatorios', () => {
  it('lista só publicados, do mais recente para o mais antigo', async () => {
    const res = await request(app).get('/api/relatorios');

    expect(res.status).toBe(200);
    const meus = idsDaResposta(res.body).filter((id) => Object.values(ids).includes(id));
    expect(meus).toEqual([
      ids.impactoRecente,
      ids.hoteleiroRecente,
      ids.demandaAntigo,
      ids.hoteleiroAntigo,
    ]);

    const datas = res.body.map((item) => item.data_publicacao);
    expect(datas).toEqual([...datas].sort().reverse());
  });

  it('devolve os campos do contrato, sem arquivo_url nem id_usuario', async () => {
    const res = await request(app).get(`/api/relatorios?ano=${ANO_RECENTE}`);

    expect(res.status).toBe(200);
    const meus = res.body.filter((item) => Object.values(ids).includes(item.id));
    expect(meus).toEqual([
      {
        id: ids.impactoRecente,
        titulo: `Relatório impactoRecente ${sufixo}`,
        edicao: `${ANO_RECENTE}-12`,
        categoria: 'Impacto Econômico',
        data_publicacao: `${ANO_RECENTE}-12-31`,
        descricao: 'Descrição impactoRecente',
        tamanho_kb: 120,
        url_arquivo: `/api/relatorios/${ids.impactoRecente}/arquivo`,
      },
      {
        id: ids.hoteleiroRecente,
        titulo: `Relatório hoteleiroRecente ${sufixo}`,
        edicao: `${ANO_RECENTE}-01`,
        categoria: 'Setor Hoteleiro',
        data_publicacao: `${ANO_RECENTE}-01-01`,
        descricao: 'Descrição hoteleiroRecente',
        tamanho_kb: null,
        url_arquivo: `/api/relatorios/${ids.hoteleiroRecente}/arquivo`,
      },
    ]);
    expect(JSON.stringify(res.body)).not.toContain('arquivo_url');
    expect(JSON.stringify(res.body)).not.toContain('id_usuario');
    expect(JSON.stringify(res.body)).not.toContain(sufixo + '-');
  });

  it('filtra por ano usando a data de publicação, incluindo 1º de janeiro e 31 de dezembro', async () => {
    const res = await request(app).get(`/api/relatorios?ano=${ANO_ANTIGO}`);

    expect(res.status).toBe(200);
    const meus = idsDaResposta(res.body).filter((id) => Object.values(ids).includes(id));
    expect(meus).toEqual([ids.demandaAntigo, ids.hoteleiroAntigo]);
  });

  it('desempata relatórios da mesma data pelo cadastrado por último', async () => {
    const mesmaData = await prisma.relatorio.create({
      data: relatorio('mesmaData', {
        data: `${ANO_ANTIGO}-11-30`,
        categoria: 'Perfil de Demanda',
        status: 'publicado',
      }),
    });

    const res = await request(app).get(`/api/relatorios?ano=${ANO_ANTIGO}`);
    await prisma.relatorio.delete({ where: { id_relatorio: mesmaData.id_relatorio } });

    expect(res.status).toBe(200);
    const meus = idsDaResposta(res.body).filter((id) =>
      [...Object.values(ids), mesmaData.id_relatorio].includes(id)
    );
    expect(meus).toEqual([
      mesmaData.id_relatorio,
      ids.demandaAntigo,
      ids.hoteleiroAntigo,
    ]);
  });

  it('filtra por categoria', async () => {
    const res = await request(app).get(`/api/relatorios?categoria=${encodeURIComponent('Setor Hoteleiro')}`);

    expect(res.status).toBe(200);
    expect(res.body.every((item) => item.categoria === 'Setor Hoteleiro')).toBe(true);
    const meus = idsDaResposta(res.body).filter((id) => Object.values(ids).includes(id));
    expect(meus).toEqual([ids.hoteleiroRecente, ids.hoteleiroAntigo]);
  });

  it('combina ano e categoria', async () => {
    const res = await request(app)
      .get('/api/relatorios')
      .query({ ano: String(ANO_RECENTE), categoria: 'Setor Hoteleiro' });

    expect(res.status).toBe(200);
    const meus = idsDaResposta(res.body).filter((id) => Object.values(ids).includes(id));
    expect(meus).toEqual([ids.hoteleiroRecente]);
  });

  it('responde 200 com [] para filtro válido sem resultado', async () => {
    const res = await request(app)
      .get('/api/relatorios')
      .query({ ano: String(ANO_ANTIGO), categoria: 'Diagnóstico Estratégico' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it.each([
    ['ano=abc'],
    ['ano=25'],
    ['ano=20255'],
    ['ano='],
    [`ano=${ANO_ANTIGO}&ano=${ANO_RECENTE}`],
  ])('responde 400 para %s', async (consulta) => {
    const res = await request(app).get(`/api/relatorios?${consulta}`);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ erro: 'ano deve ser um número inteiro de 4 dígitos' });
  });

  it.each([
    ['categoria desconhecida', 'categoria=Outros'],
    ['categoria com caixa diferente', `categoria=${encodeURIComponent('setor hoteleiro')}`],
    ['categoria sem acento', `categoria=${encodeURIComponent('Impacto Economico')}`],
    ['categoria vazia', 'categoria='],
    ['categoria repetida', `categoria=${encodeURIComponent('Setor Hoteleiro')}&categoria=${encodeURIComponent('Perfil de Demanda')}`],
  ])('responde 400 para %s', async (_caso, consulta) => {
    const res = await request(app).get(`/api/relatorios?${consulta}`);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ erro: 'Categoria inválida' });
  });

  it('valida o ano antes da categoria quando os dois estão errados', async () => {
    const res = await request(app).get('/api/relatorios?ano=abc&categoria=Outros');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ erro: 'ano deve ser um número inteiro de 4 dígitos' });
  });
});
