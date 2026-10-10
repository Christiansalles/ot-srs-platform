// Acesso ao banco. É a única camada que fala com o Prisma; ela só traduz as
// colunas do DER (id_setor, id_indicador...) para o formato da API.
// Ordenação, conversão de `valor` e as regras do contrato ficam em
// services/indicadores.js.

const prisma = require('../db');

const STATUS_PUBLICADO = 'publicado';

async function buscarSetores() {
  const setores = await prisma.setor.findMany();
  return setores.map((setor) => ({ id: setor.id_setor, nome: setor.nome }));
}

async function buscarPeriodos() {
  const periodos = await prisma.periodo.findMany();
  return periodos.map((periodo) => ({
    id: periodo.id_periodo,
    ano: periodo.ano,
    semestre: periodo.semestre,
  }));
}

// setorId é opcional; sem ele, traz os indicadores de todos os setores.
// Só medições publicadas vêm do banco.
async function buscarIndicadores({ setorId, ano, semestre } = {}) {
  const periodoWhere = ano === undefined
    ? undefined
    : semestre === undefined
      ? { ano }
      : { ano, semestre };
  const indicadores = await prisma.indicador.findMany({
    where: {
      ...(setorId === undefined ? {} : { id_setor: setorId }),
      ...(ano === undefined ? {} : {
        medicoes: {
          some: {
            status: STATUS_PUBLICADO,
            periodo: { is: periodoWhere },
          },
        },
      }),
    },
    include: {
      setor: true,
      medicoes: {
        where: {
          status: STATUS_PUBLICADO,
          ...(periodoWhere ? { periodo: { is: periodoWhere } } : {}),
        },
        include: { periodo: true },
      },
    },
  });

  // Destaques precisam da medição publicada imediatamente anterior ao período
  // escolhido. Buscamos candidatos anteriores no banco e selecionamos a mais
  // recente por indicador; a lista pública continua usando apenas `medicoes`.
  let anteriores = [];
  if (ano !== undefined && indicadores.length > 0) {
    const ids = indicadores.map((indicador) => indicador.id_indicador);
    anteriores = await prisma.medicao.findMany({
      where: {
        id_indicador: { in: ids },
        status: STATUS_PUBLICADO,
        periodo: {
          is: { OR: semestre === undefined
            ? [{ ano: { lte: ano } }]
            : [{ ano: { lt: ano } }, { ano, semestre: { lt: semestre } }] },
        },
      },
      include: { periodo: true },
    });
  }

  const anterioresPorIndicador = new Map();
  for (const medicao of anteriores) {
    const grupo = anterioresPorIndicador.get(medicao.id_indicador) || [];
    grupo.push(medicao);
    anterioresPorIndicador.set(medicao.id_indicador, grupo);
  }

  return indicadores.map((indicador) => ({
    id: indicador.id_indicador,
    nome: indicador.nome,
    unidade: indicador.unidade,
    setor: { id: indicador.setor.id_setor, nome: indicador.setor.nome },
    medicoes: indicador.medicoes.map((medicao) => ({
      ano: medicao.periodo.ano,
      semestre: medicao.periodo.semestre,
      valor: medicao.valor,
      status: medicao.status,
    })),
    medicoesCandidatasAnteriores: (anterioresPorIndicador.get(indicador.id_indicador) || []).map((medicao) => ({
      ano: medicao.periodo.ano,
      semestre: medicao.periodo.semestre,
      valor: medicao.valor,
      status: medicao.status,
    })),
  }));
}

module.exports = { buscarSetores, buscarPeriodos, buscarIndicadores };
