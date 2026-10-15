const INDICADOR_PARTICIPACAO = 'Participação econômica'

function mesmoPeriodo(medicao, periodo) {
  return medicao.ano === periodo.ano && medicao.semestre === periodo.semestre
}

function maisRecente(atual, medicao) {
  if (!atual) return medicao

  const avancou =
    medicao.ano > atual.ano ||
    (medicao.ano === atual.ano && medicao.semestre > atual.semestre)

  return avancou ? medicao : atual
}

function participacoesDe(indicadores) {
  return indicadores.filter(
    (indicador) => indicador.nome === INDICADOR_PARTICIPACAO,
  )
}

// Período mais recente entre todos os setores, ou null quando não há dados.
export function periodoMaisRecente(indicadores) {
  const periodo = participacoesDe(indicadores)
    .flatMap((indicador) => indicador.medicoes)
    .reduce(maisRecente, null)

  return periodo ? { ano: periodo.ano, semestre: periodo.semestre } : null
}

// Monta os dados da rosca a partir de /api/indicadores: um item por setor,
// com a participação econômica do período mais recente, do maior para o menor.
export function montarDistribuicao(indicadores) {
  const periodo = periodoMaisRecente(indicadores)

  if (!periodo) return []

  return participacoesDe(indicadores)
    .map((indicador) => {
      const medicao = indicador.medicoes.find((item) => mesmoPeriodo(item, periodo))

      return medicao ? { nome: indicador.setor.nome, valor: medicao.valor } : null
    })
    .filter(Boolean)
    .sort((a, b) => b.valor - a.valor)
}
