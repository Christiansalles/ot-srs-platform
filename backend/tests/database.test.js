const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('Schema do banco de dados', () => {
  let setor;
  let indicador;
  let periodo;
  let periodoStatusInvalido;
  let usuario;

  beforeAll(async () => {
    usuario = await prisma.usuario.create({
      data: {
        nome: 'Usuário Teste',
        email: `teste-${Date.now()}@teste.com`,
        senha_hash: 'hash-teste',
        ativo: true,
      },
    });

    setor = await prisma.setor.create({
      data: {
        nome: `Hospedagem ${Date.now()}`,
        descricao: 'Setor de teste',
      },
    });

    indicador = await prisma.indicador.create({
      data: {
        id_setor: setor.id_setor,
        nome: `Leitos ${Date.now()}`,
        descricao: 'Indicador de teste',
        unidade: 'leitos',
      },
    });

    periodo = await prisma.periodo.create({
      data: {
        ano: 2025,
        semestre: 2,
      },
    });

    periodoStatusInvalido = await prisma.periodo.create({
      data: {
        ano: 2026,
        semestre: 1,
      },
    });
  });

  afterAll(async () => {
    await prisma.medicao.deleteMany({
      where: {
        id_usuario: usuario.id_usuario,
      },
    });

    await prisma.indicador.delete({
      where: {
        id_indicador: indicador.id_indicador,
      },
    });

    await prisma.periodo.deleteMany({
      where: {
        id_periodo: {
          in: [periodo.id_periodo, periodoStatusInvalido.id_periodo],
        },
      },
    });

    await prisma.setor.delete({
      where: {
        id_setor: setor.id_setor,
      },
    });

    await prisma.usuario.delete({
      where: {
        id_usuario: usuario.id_usuario,
      },
    });

    await prisma.$disconnect();
  });

  test('cria registros nas tabelas principais', () => {
    expect(setor.id_setor).toBeDefined();
    expect(indicador.id_indicador).toBeDefined();
    expect(periodo.id_periodo).toBeDefined();
    expect(usuario.id_usuario).toBeDefined();
  });

  test('não permite período duplicado', async () => {
    await expect(
      prisma.periodo.create({
        data: {
          ano: periodo.ano,
          semestre: periodo.semestre,
        },
      })
    ).rejects.toThrow();
  });

  test('não permite indicador duplicado no mesmo período', async () => {
    await prisma.medicao.create({
      data: {
        id_indicador: indicador.id_indicador,
        id_periodo: periodo.id_periodo,
        id_usuario: usuario.id_usuario,
        valor: 350,
        status: 'publicado',
      },
    });

    await expect(
      prisma.medicao.create({
        data: {
          id_indicador: indicador.id_indicador,
          id_periodo: periodo.id_periodo,
          id_usuario: usuario.id_usuario,
          valor: 400,
          status: 'publicado',
        },
      })
    ).rejects.toThrow();
  });

  test('aceita status publicado', async () => {
    const medicao = await prisma.medicao.findFirst({
      where: {
        id_indicador: indicador.id_indicador,
        id_periodo: periodo.id_periodo,
      },
    });

    expect(medicao.status).toBe('publicado');
  });

  test('não permite status inválido', async () => {
    await expect(
      prisma.medicao.create({
        data: {
          id_indicador: indicador.id_indicador,
          id_periodo: periodoStatusInvalido.id_periodo,
          id_usuario: usuario.id_usuario,
          valor: 500,
          status: 'invalido',
        },
      })
    ).rejects.toThrow();
  });
});