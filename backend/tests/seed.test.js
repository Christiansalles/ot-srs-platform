const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const prisma = require('../src/db');
const dados = require('../src/services/dados');
const { formatarIndicadores, montarDestaques } = require('../src/services/indicadores');

const backendDir = path.resolve(__dirname, '..');
const dadosDir = path.join(backendDir, 'prisma', 'dados');
const seedPath = path.join(backendDir, 'prisma', 'seed.js');

function setoresEsperados() {
  const setores = fs
    .readdirSync(dadosDir)
    .filter((arquivo) => path.extname(arquivo).toLowerCase() === '.json')
    .flatMap((arquivo) => {
      const dados = JSON.parse(fs.readFileSync(path.join(dadosDir, arquivo), 'utf8'));

      if (dados.setor) {
        return [{ setor: dados.setor, indicadores: dados.indicadores }];
      }

      return dados.setores.map((setor) => ({
        setor,
        indicadores: setor.indicadores || [
          { ...dados.indicador, medicoes: setor.medicoes },
        ],
      }));
    });

  const porNome = new Map();
  for (const item of setores) {
    const existente = porNome.get(item.setor.nome);
    if (existente) {
      existente.indicadores.push(...item.indicadores);
    } else {
      porNome.set(item.setor.nome, {
        setor: item.setor,
        indicadores: [...item.indicadores],
      });
    }
  }

  return [...porNome.values()];
}

function executarSeed() {
  execFileSync(process.execPath, [seedPath], {
    cwd: backendDir,
    stdio: 'inherit',
  });
}

describe('Seed de todos os setores', () => {
  const esperados = setoresEsperados();

  beforeAll(() => {
    executarSeed();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('carrega indicadores e medições dos formatos setor e setores', async () => {
    for (const { setor, indicadores } of esperados) {
      const carregados = await prisma.indicador.findMany({
        where: { setor: { nome: setor.nome } },
        include: { medicoes: true },
      });

      const quantidadeMedicoesEsperada = indicadores.reduce(
        (total, indicador) => total + indicador.medicoes.length,
        0
      );

      expect(carregados).toHaveLength(indicadores.length);
      expect(carregados.reduce((total, indicador) => total + indicador.medicoes.length, 0))
        .toBe(quantidadeMedicoesEsperada);
    }
  });

  test('publica os 6 setores, 12 indicadores e 23 medições entre 2020/2 e 2025/2', async () => {
    const nomesSetores = esperados.map(({ setor }) => setor.nome);
    const [setores, indicadores, medicoes] = await Promise.all([
      prisma.setor.count({ where: { nome: { in: nomesSetores } } }),
      prisma.indicador.count({ where: { setor: { nome: { in: nomesSetores } } } }),
      prisma.medicao.findMany({
        where: { usuario: { email: 'carga-inicial@observatorio.local' } },
        include: { periodo: true },
      }),
    ]);

    expect(setores).toBe(6);
    expect(indicadores).toBe(12);
    expect(medicoes).toHaveLength(23);
    expect(medicoes.every((medicao) => medicao.status === 'publicado')).toBe(true);

    const periodos = medicoes.map(({ periodo }) => periodo.ano * 10 + periodo.semestre);
    expect(Math.min(...periodos)).toBe(20202);
    expect(Math.max(...periodos)).toBe(20252);
  });

  test('mantém os valores conhecidos e soma 100% na participação de 2025/2', async () => {
    const buscarValor = async (setor, indicador, ano = 2025) => {
      const medicao = await prisma.medicao.findFirst({
        where: {
          indicador: { setor: { nome: setor }, nome: indicador },
          periodo: { ano, semestre: 2 },
        },
      });
      return medicao && Number(medicao.valor);
    };

    expect(await buscarValor('Turismo', 'Fluxo de visitantes')).toBe(5200);
    expect(await buscarValor('Turismo', 'Número de empresas')).toBe(120);
    expect(await buscarValor('Turismo', 'Número de empresas', 2024)).toBe(104);
    expect(await buscarValor('Alimentação & Bares', 'Participação econômica')).toBe(24);

    const participacoes = await prisma.medicao.findMany({
      where: {
        indicador: { nome: 'Participação econômica' },
        periodo: { ano: 2025, semestre: 2 },
        status: 'publicado',
      },
    });
    expect(participacoes.reduce((total, medicao) => total + Number(medicao.valor), 0)).toBe(100);

    const turismo = (await dados.buscarSetores()).find(({ nome }) => nome === 'Turismo');
    const indicadores = await dados.buscarIndicadores({ setorId: turismo.id });
    const destaque = montarDestaques(formatarIndicadores(indicadores))
      .find(({ nome }) => nome === 'Número de empresas');
    expect(destaque.variacao_percentual).toBe(15.4);
  });

  test('executar novamente mantém uma medição por indicador e período', async () => {
    const totaisAntes = await Promise.all(
      esperados.map(({ setor }) =>
        prisma.medicao.count({ where: { indicador: { setor: { nome: setor.nome } } } })
      )
    );

    executarSeed();

    expect(await prisma.medicao.count({
      where: { usuario: { email: 'carga-inicial@observatorio.local' } },
    })).toBe(23);

    const totaisDepois = await Promise.all(
      esperados.map(({ setor }) =>
        prisma.medicao.count({ where: { indicador: { setor: { nome: setor.nome } } } })
      )
    );

    expect(totaisDepois).toEqual(totaisAntes);
  });
});
