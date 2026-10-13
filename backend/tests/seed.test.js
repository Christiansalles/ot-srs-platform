const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const prisma = require('../src/db');

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

  test('executar novamente mantém uma medição por indicador e período', async () => {
    const totaisAntes = await Promise.all(
      esperados.map(({ setor }) =>
        prisma.medicao.count({ where: { indicador: { setor: { nome: setor.nome } } } })
      )
    );

    executarSeed();

    const totaisDepois = await Promise.all(
      esperados.map(({ setor }) =>
        prisma.medicao.count({ where: { indicador: { setor: { nome: setor.nome } } } })
      )
    );

    expect(totaisDepois).toEqual(totaisAntes);
  });
});
