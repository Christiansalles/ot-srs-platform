const fs = require('fs');
const path = require('path');
const prisma = require('../src/db');
const dados = require('../src/services/dados');
const { formatarIndicadores, montarDestaques } = require('../src/services/indicadores');
const { executarSeed, limparUploads, uploadsDir } = require('./helpers/seed');

const backendDir = path.resolve(__dirname, '..');
const dadosDir = path.join(backendDir, 'prisma', 'dados');
const relatoriosEsperados = JSON.parse(
  fs.readFileSync(path.join(dadosDir, 'relatorios', 'relatorios.json'), 'utf8')
);

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

describe('Seed de todos os setores', () => {
  const esperados = setoresEsperados();

  beforeAll(() => {
    executarSeed();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    limparUploads();
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

  test('publica os relatórios ilustrativos e copia seus PDFs para UPLOADS_DIR', async () => {
    const relatorios = await prisma.relatorio.findMany({
      where: { edicao: { in: relatoriosEsperados.map(({ edicao }) => edicao) } },
    });

    expect(relatorios).toHaveLength(relatoriosEsperados.length);
    expect(fs.readdirSync(uploadsDir).sort()).toEqual(
      relatoriosEsperados.map(({ arquivo }) => arquivo).sort()
    );
    for (const esperado of relatoriosEsperados) {
      const relatorio = relatorios.find(({ edicao }) => edicao === esperado.edicao);
      expect(relatorio).toMatchObject({
        titulo: esperado.titulo,
        edicao: esperado.edicao,
        categoria: esperado.categoria,
        arquivo_url: esperado.arquivo,
        status: 'publicado',
      });
      expect(path.basename(relatorio.arquivo_url)).toBe(relatorio.arquivo_url);

      const arquivo = path.join(uploadsDir, relatorio.arquivo_url);
      expect(fs.existsSync(arquivo)).toBe(true);
      expect(relatorio.tamanho_kb).toBe(Math.ceil(fs.statSync(arquivo).size / 1024));
    }
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

    const edicoes = relatoriosEsperados.map(({ edicao }) => edicao);
    const relatoriosAntes = await prisma.relatorio.findMany({
      where: { edicao: { in: edicoes } },
      select: { id_relatorio: true, edicao: true },
      orderBy: { edicao: 'asc' },
    });
    const arquivosAntes = fs.readdirSync(uploadsDir).sort();

    executarSeed();

    const [totalSetores, totalIndicadores, totalMedicoes, relatoriosDepois] = await Promise.all([
      prisma.setor.count({ where: { nome: { in: esperados.map(({ setor }) => setor.nome) } } }),
      prisma.indicador.count({ where: { setor: { nome: { in: esperados.map(({ setor }) => setor.nome) } } } }),
      prisma.medicao.count({ where: { usuario: { email: 'carga-inicial@observatorio.local' } } }),
      prisma.relatorio.findMany({
        where: { edicao: { in: edicoes } },
        select: { id_relatorio: true, edicao: true },
        orderBy: { edicao: 'asc' },
      }),
    ]);

    expect(totalSetores).toBe(6);
    expect(totalIndicadores).toBe(12);
    expect(totalMedicoes).toBe(23);
    expect(relatoriosDepois).toHaveLength(relatoriosEsperados.length);
    expect(relatoriosDepois).toEqual(relatoriosAntes);
    expect(fs.readdirSync(uploadsDir).sort()).toEqual(arquivosAntes);

    const totaisDepois = await Promise.all(
      esperados.map(({ setor }) =>
        prisma.medicao.count({ where: { indicador: { setor: { nome: setor.nome } } } })
      )
    );

    expect(totaisDepois).toEqual(totaisAntes);
  });
});
