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
async function buscarIndicadores({ setorId } = {}) {
  const indicadores = await prisma.indicador.findMany({
    where: setorId === undefined ? {} : { id_setor: setorId },
    include: {
      setor: true,
      medicoes: {
        where: { status: STATUS_PUBLICADO },
        include: { periodo: true },
      },
    },
  });

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
  }));
}

module.exports = { buscarSetores, buscarPeriodos, buscarIndicadores };
