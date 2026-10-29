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

// Só períodos com alguma medição publicada: o cadastro de uma medição em
// rascunho cria o período, e ele não pode aparecer no filtro público antes
// de o administrador publicar.
async function buscarPeriodos() {
  const periodos = await prisma.periodo.findMany({
    where: { medicoes: { some: { status: STATUS_PUBLICADO } } },
  });
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

// Consulta administrativa: inclui todos os indicadores e medições de qualquer
// status. Os filtros não alteram a consulta pública acima.
async function buscarIndicadoresAdmin({ setorId, status } = {}) {
  const indicadores = await prisma.indicador.findMany({
    where: {
      ...(setorId === undefined ? {} : { id_setor: setorId }),
      ...(status === undefined ? {} : { medicoes: { some: { status } } }),
    },
    include: {
      setor: true,
      medicoes: {
        ...(status === undefined ? {} : { where: { status } }),
        include: { periodo: true },
      },
    },
  });

  return indicadores
    .map((indicador) => ({
      id: indicador.id_indicador,
      nome: indicador.nome,
      unidade: indicador.unidade,
      descricao: indicador.descricao,
      setor: { id: indicador.setor.id_setor, nome: indicador.setor.nome },
      medicoes: indicador.medicoes
        .map(formatarMedicaoAdmin)
        .sort((a, b) => a.ano - b.ano || a.semestre - b.semestre),
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

function formatarMedicaoAdmin(medicao) {
  return {
    id: medicao.id_medicao,
    ano: medicao.periodo.ano,
    semestre: medicao.periodo.semestre,
    valor: Number(medicao.valor),
    status: medicao.status,
  };
}

async function criarIndicador({ id_setor, nome, descricao, unidade }) {
  try {
    const item = await prisma.indicador.create({
      data: { id_setor, nome, descricao, unidade },
      include: { setor: true },
    });
    return {
      id: item.id_indicador,
      nome: item.nome,
      unidade: item.unidade,
      descricao: item.descricao,
      setor: { id: item.setor.id_setor, nome: item.setor.nome },
      medicoes: [],
    };
  } catch (erro) {
    if (erro.code === 'P2003') return null;
    throw erro;
  }
}

async function atualizarIndicador(id, { id_setor, nome, descricao, unidade }) {
  try {
    const item = await prisma.indicador.update({
      where: { id_indicador: id },
      data: { id_setor, nome, descricao, unidade },
      include: { setor: true, medicoes: { include: { periodo: true } } },
    });
    return {
      id: item.id_indicador,
      nome: item.nome,
      unidade: item.unidade,
      descricao: item.descricao,
      setor: { id: item.setor.id_setor, nome: item.setor.nome },
      medicoes: item.medicoes.map(formatarMedicaoAdmin),
    };
  } catch (erro) {
    if (erro.code === 'P2025') return null;
    if (erro.code === 'P2003') return { setorInvalido: true };
    throw erro;
  }
}

async function criarMedicao({ id_indicador, ano, semestre, valor, id_usuario }) {
  try {
    const medicao = await prisma.$transaction(async (tx) => {
      const periodo = await tx.periodo.upsert({
        where: { ano_semestre: { ano, semestre } },
        create: { ano, semestre },
        update: {},
      });
      return tx.medicao.create({
        data: {
          id_indicador,
          id_periodo: periodo.id_periodo,
          id_usuario,
          valor,
          status: 'rascunho',
        },
        include: { periodo: true },
      });
    });
    return formatarMedicaoAdmin(medicao);
  } catch (erro) {
    if (erro.code === 'P2002') return { conflito: true, ano, semestre };
    if (erro.code === 'P2003') return { indicadorInvalido: true };
    throw erro;
  }
}

async function atualizarMedicao(id, { ano, semestre, valor }) {
  let periodoConflito = { ano, semestre };
  try {
    const resultado = await prisma.$transaction(async (tx) => {
      const atual = await tx.medicao.findUnique({
        where: { id_medicao: id },
        include: { periodo: true },
      });
      if (!atual) return { naoEncontrada: true };
      if (atual.status === 'publicado') return { publicada: true };

      const anoFinal = ano === undefined ? atual.periodo.ano : ano;
      const semestreFinal = semestre === undefined ? atual.periodo.semestre : semestre;
      periodoConflito = { ano: anoFinal, semestre: semestreFinal };
      const periodo = ano === undefined && semestre === undefined
        ? atual.periodo
        : await tx.periodo.upsert({
          where: { ano_semestre: { ano: anoFinal, semestre: semestreFinal } },
          create: { ano: anoFinal, semestre: semestreFinal },
          update: {},
        });

      const atualizada = await tx.medicao.updateMany({
        where: { id_medicao: id, status: 'rascunho' },
        data: { id_periodo: periodo.id_periodo, valor },
      });
      if (atualizada.count === 0) return { publicada: true };
      const medicao = await tx.medicao.findUnique({
        where: { id_medicao: id },
        include: { periodo: true },
      });
      return { medicao };
    });
    if (resultado.naoEncontrada || resultado.publicada) return resultado;
    return formatarMedicaoAdmin(resultado.medicao);
  } catch (erro) {
    if (erro.code === 'P2002') return { conflito: true, ...periodoConflito };
    throw erro;
  }
}

// Só relatórios publicados. `ano` filtra pelo ano de data_publicacao e
// `categoria` pelo texto exato; os dois são opcionais.
// arquivo_url e id_usuario não saem desta camada.
async function buscarRelatoriosPublicados({ ano, categoria } = {}) {
  const relatorios = await prisma.relatorio.findMany({
    where: {
      status: STATUS_PUBLICADO,
      ...(ano === undefined ? {} : {
        data_publicacao: {
          gte: new Date(Date.UTC(ano, 0, 1)),
          lt: new Date(Date.UTC(ano + 1, 0, 1)),
        },
      }),
      ...(categoria === undefined ? {} : { categoria }),
    },
    orderBy: [{ data_publicacao: 'desc' }, { id_relatorio: 'desc' }],
    select: {
      id_relatorio: true,
      titulo: true,
      edicao: true,
      categoria: true,
      data_publicacao: true,
      descricao: true,
      tamanho_kb: true,
    },
  });

  return relatorios.map((relatorio) => ({
    id: relatorio.id_relatorio,
    titulo: relatorio.titulo,
    edicao: relatorio.edicao,
    categoria: relatorio.categoria,
    data_publicacao: relatorio.data_publicacao,
    descricao: relatorio.descricao,
    tamanho_kb: relatorio.tamanho_kb,
  }));
}

// Consulta administrativa: inclui relatórios em qualquer status.
async function buscarRelatoriosAdmin() {
  const relatorios = await prisma.relatorio.findMany({
    orderBy: [{ data_publicacao: 'desc' }, { id_relatorio: 'desc' }],
  });
  return relatorios.map((relatorio) => ({
    id: relatorio.id_relatorio,
    titulo: relatorio.titulo,
    edicao: relatorio.edicao,
    categoria: relatorio.categoria,
    data_publicacao: relatorio.data_publicacao,
    descricao: relatorio.descricao,
    tamanho_kb: relatorio.tamanho_kb,
    status: relatorio.status,
  }));
}

async function criarRelatorio({ id_usuario, titulo, edicao, categoria, data_publicacao, descricao, arquivo_url, tamanho_kb }) {
  const relatorio = await prisma.relatorio.create({
    data: {
      id_usuario,
      titulo,
      edicao,
      categoria,
      data_publicacao,
      descricao,
      arquivo_url,
      tamanho_kb,
      status: 'rascunho',
    },
  });
  return {
    id: relatorio.id_relatorio,
    titulo: relatorio.titulo,
    edicao: relatorio.edicao,
    categoria: relatorio.categoria,
    data_publicacao: relatorio.data_publicacao,
    descricao: relatorio.descricao,
    tamanho_kb: relatorio.tamanho_kb,
    status: relatorio.status,
  };
}

// P2025: o Prisma não achou o registro para atualizar.
async function atualizarOuNulo(atualizar) {
  try {
    return await atualizar();
  } catch (erro) {
    if (erro.code === 'P2025') return null;
    throw erro;
  }
}

// Devolvem null para id inexistente; a rota responde 404.
async function atualizarStatusMedicao(id, status) {
  const medicao = await atualizarOuNulo(() => prisma.medicao.update({
    where: { id_medicao: id },
    data: { status },
    include: { periodo: true },
  }));
  if (!medicao) return null;

  return {
    id: medicao.id_medicao,
    ano: medicao.periodo.ano,
    semestre: medicao.periodo.semestre,
    valor: Number(medicao.valor),
    status: medicao.status,
  };
}

async function atualizarStatusRelatorio(id, status) {
  const relatorio = await atualizarOuNulo(() => prisma.relatorio.update({
    where: { id_relatorio: id },
    data: { status },
  }));
  if (!relatorio) return null;

  return {
    id: relatorio.id_relatorio,
    titulo: relatorio.titulo,
    edicao: relatorio.edicao,
    categoria: relatorio.categoria,
    data_publicacao: relatorio.data_publicacao,
    descricao: relatorio.descricao,
    tamanho_kb: relatorio.tamanho_kb,
    status: relatorio.status,
  };
}

module.exports = {
  buscarSetores,
  buscarPeriodos,
  buscarIndicadores,
  buscarIndicadoresAdmin,
  criarIndicador,
  atualizarIndicador,
  criarMedicao,
  atualizarMedicao,
  buscarRelatoriosPublicados,
  buscarRelatoriosAdmin,
  criarRelatorio,
  atualizarStatusMedicao,
  atualizarStatusRelatorio,
};
