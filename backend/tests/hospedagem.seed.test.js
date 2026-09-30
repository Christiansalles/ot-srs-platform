const { execFileSync } = require('child_process');
const path = require('path');
const prisma = require('../src/db');

const backendDir = path.resolve(__dirname, '..');
const seedPath = path.join(backendDir, 'prisma', 'seed.js');

describe('Seed da carga de hospedagem', () => {
  let setor;
  let indicadores;
  let medicoes;

  beforeAll(async () => {
    execFileSync(process.execPath, [seedPath], {
      cwd: backendDir,
      stdio: 'inherit',
    });

    [setor, indicadores, medicoes] = await Promise.all([
      prisma.setor.findUnique({
        where: {
          nome: 'Hospedagem',
        },
      }),
      prisma.indicador.findMany({
        where: {
          setor: {
            nome: 'Hospedagem',
          },
        },
        include: {
          medicoes: {
            include: {
              periodo: true,
            },
          },
        },
      }),
      prisma.medicao.findMany({
        where: {
          indicador: {
            setor: {
              nome: 'Hospedagem',
            },
          },
        },
        include: {
          indicador: true,
          periodo: true,
        },
      }),
    ]);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('cria exatamente 4 medições de hospedagem', () => {
    expect(setor).not.toBeNull();
    expect(indicadores).toHaveLength(2);
    expect(medicoes).toHaveLength(4);
  });

  test('cria 3 medições de leitos e 1 de taxa de ocupação', () => {
    const medicoesLeitos = medicoes.filter(
      (medicao) => medicao.indicador.nome === 'Número de leitos'
    );

    const medicoesTaxaOcupacao = medicoes.filter(
      (medicao) => medicao.indicador.nome === 'Taxa de ocupação'
    );

    expect(medicoesLeitos).toHaveLength(3);
    expect(medicoesTaxaOcupacao).toHaveLength(1);
  });

  test('cria 350 leitos no período 2025/2', () => {
    const medicao = medicoes.find(
      (item) =>
        item.indicador.nome === 'Número de leitos' &&
        item.periodo.ano === 2025 &&
        item.periodo.semestre === 2
    );

    expect(medicao).toBeDefined();
    expect(Number(medicao.valor)).toBe(350);
  });

  test('todas as medições estão publicadas', () => {
    expect(medicoes.every((medicao) => medicao.status === 'publicado')).toBe(true);
  });

  test('executar o seed novamente mantém exatamente 4 medições', async () => {
    execFileSync(process.execPath, [seedPath], {
      cwd: backendDir,
      stdio: 'inherit',
    });

    const quantidade = await prisma.medicao.count({
      where: {
        indicador: {
          setor: {
            nome: 'Hospedagem',
          },
        },
      },
    });

    expect(quantidade).toBe(4);
  });

  test('não permite inserir a mesma medição duas vezes', async () => {
    const medicao = medicoes[0];

    await expect(
      prisma.medicao.create({
        data: {
          id_indicador: medicao.id_indicador,
          id_periodo: medicao.id_periodo,
          id_usuario: medicao.id_usuario,
          valor: medicao.valor,
          status: 'publicado',
        },
      })
    ).rejects.toThrow();
  });
});