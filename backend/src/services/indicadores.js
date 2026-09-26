// Regras do contrato da API (docs/contrato-api.md) que não dependem do banco.

const STATUS_PUBLICADO = 'publicado';

function compararPorNome(a, b) {
  return a.nome.localeCompare(b.nome, 'pt-BR');
}

function compararPorPeriodo(a, b) {
  return a.ano - b.ano || a.semestre - b.semestre;
}

function ordenarSetores(setores) {
  return [...setores].sort(compararPorNome);
}

function ordenarPeriodos(periodos) {
  return [...periodos].sort(compararPorPeriodo);
}

// (atual - anterior) / anterior * 100, com 1 casa decimal.
// Sem valor anterior, ou com anterior igual a 0, a variação é null.
function calcularVariacaoPercentual(atual, anterior) {
  if (anterior === null || anterior === undefined || anterior === 0) {
    return null;
  }
  return Math.round(((atual - anterior) / anterior) * 1000) / 10;
}

// Só medições publicadas, em ordem cronológica e com `valor` como number.
// Indicador sem nenhuma medição publicada fica de fora.
function formatarIndicadores(indicadores) {
  return indicadores
    .map((indicador) => ({
      id: indicador.id,
      nome: indicador.nome,
      unidade: indicador.unidade,
      setor: { id: indicador.setor.id, nome: indicador.setor.nome },
      medicoes: indicador.medicoes
        .filter((medicao) => medicao.status === STATUS_PUBLICADO)
        .map((medicao) => ({
          ano: medicao.ano,
          semestre: medicao.semestre,
          valor: Number(medicao.valor),
        }))
        .sort(compararPorPeriodo),
    }))
    .filter((indicador) => indicador.medicoes.length > 0)
    .sort(compararPorNome);
}

// Um item por indicador: o período publicado mais recente e a variação contra
// a medição publicada anterior do mesmo indicador (não precisa ser o semestre
// imediatamente anterior). Recebe a saída de formatarIndicadores.
function montarDestaques(indicadores) {
  return indicadores.map((indicador) => {
    const atual = indicador.medicoes[indicador.medicoes.length - 1];
    const anterior = indicador.medicoes[indicador.medicoes.length - 2];

    return {
      id: indicador.id,
      nome: indicador.nome,
      unidade: indicador.unidade,
      valor: atual.valor,
      periodo: { ano: atual.ano, semestre: atual.semestre },
      variacao_percentual: calcularVariacaoPercentual(atual.valor, anterior?.valor),
    };
  });
}

module.exports = {
  ordenarSetores,
  ordenarPeriodos,
  calcularVariacaoPercentual,
  formatarIndicadores,
  montarDestaques,
};
