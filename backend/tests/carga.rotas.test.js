// Teste de integração: as rotas com filtro contra a carga de prisma/dados,
// sem mock. Precisa de um Postgres com `npm run db:setup` já executado
// (no CI, o job backend roda antes dos testes).
//
// Outros testes criam indicadores com o mesmo nome em 2098 e 2099 enquanto
// este roda, por isso os destaques são localizados pelo id do indicador da
// carga, e não pelo nome.

const request = require('supertest');
const prisma = require('../src/db');
const app = require('../src/app');

const ids = {};

async function idDoIndicador(setor, nome) {
  const indicador = await prisma.indicador.findFirstOrThrow({
    where: { nome, setor: { nome: setor } },
  });
  return indicador.id_indicador;
}

beforeAll(async () => {
  ids.visitantes = await idDoIndicador('Turismo', 'Fluxo de visitantes');
  ids.empresas = await idDoIndicador('Turismo', 'Número de empresas');
  ids.leitos = await idDoIndicador('Hospedagem', 'Número de leitos');
  ids.ocupacao = await idDoIndicador('Hospedagem', 'Taxa de ocupação');
});

afterAll(async () => {
  await prisma.$disconnect();
});

function destaque(body, id) {
  return body.find((item) => item.id === id);
}

describe('GET /api/indicadores/destaques contra a carga', () => {
  it('sem filtro, usa o período mais recente de cada indicador', async () => {
    const res = await request(app).get('/api/indicadores/destaques');

    expect(res.status).toBe(200);
    // 5.200 em 2025/2 contra 4.400 em 2024/2.
    expect(destaque(res.body, ids.visitantes)).toMatchObject({
      valor: 5200,
      periodo: { ano: 2025, semestre: 2 },
      variacao_percentual: 18.2,
    });
    // 120 em 2025/2 contra 104 em 2024/2.
    expect(destaque(res.body, ids.empresas)).toMatchObject({
      valor: 120,
      periodo: { ano: 2025, semestre: 2 },
      variacao_percentual: 15.4,
    });
  });

  it('com ano=2024, compara com 2023, que fica fora do filtro', async () => {
    const res = await request(app).get('/api/indicadores/destaques?ano=2024');

    expect(res.status).toBe(200);
    // 312 contra 280, 4.400 contra 3.600 e 104 contra 92, todas de 2023/2.
    expect(destaque(res.body, ids.leitos)).toMatchObject({
      valor: 312,
      periodo: { ano: 2024, semestre: 2 },
      variacao_percentual: 11.4,
    });
    expect(destaque(res.body, ids.visitantes)).toMatchObject({
      valor: 4400,
      periodo: { ano: 2024, semestre: 2 },
      variacao_percentual: 22.2,
    });
    expect(destaque(res.body, ids.empresas)).toMatchObject({
      valor: 104,
      periodo: { ano: 2024, semestre: 2 },
      variacao_percentual: 13.0,
    });
    // Sem medição em 2024, fica de fora.
    expect(destaque(res.body, ids.ocupacao)).toBeUndefined();
  });
});
