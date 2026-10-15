import { INDICADORES } from '../config/indicadores'

const INDICADORES_COMPARATIVO = [
  INDICADORES.LEITOS,
  INDICADORES.VISITANTES,
  INDICADORES.EMPRESAS,
  INDICADORES.EMPREGOS,
]

function ordenarPorAno(medicoes) {
  return [...medicoes].sort(
    (a, b) =>
      a.ano - b.ano ||
      a.semestre - b.semestre,
  )
}

function ultimosDoisAnos(medicoes) {
  const anos = [...new Set(medicoes.map((item) => item.ano))]
    .sort((a, b) => b - a)

  if (anos.length < 2) return null

  return {
    anterior: anos[1],
    atual: anos[0],
  }
}

function medicaoDoAno(medicoes, ano) {
  return ordenarPorAno(medicoes)
    .filter((item) => item.ano === ano)
    .at(-1)
}

function indiceComparativo(valorAnterior, valorAtual) {
  if (valorAnterior === 0) return null

  return (valorAtual / valorAnterior) * 100
}

export function montarComparativoAnual(indicadores) {
  const selecionados = indicadores.filter((indicador) =>
    INDICADORES_COMPARATIVO.includes(indicador.nome),
  )

  const comparativos = selecionados
    .map((indicador) => {
      const anos = ultimosDoisAnos(indicador.medicoes)

      if (!anos) return null

      const anterior = medicaoDoAno(
        indicador.medicoes,
        anos.anterior,
      )

      const atual = medicaoDoAno(
        indicador.medicoes,
        anos.atual,
      )

      if (!anterior || !atual) return null

      return {
        nome: indicador.nome,
        unidade: indicador.unidade,
        anoAnterior: anos.anterior,
        anoAtual: anos.atual,
        valorAnterior: anterior.valor,
        valorAtual: atual.valor,
        anterior: 100,
        atual: indiceComparativo(
          anterior.valor,
          atual.valor,
        ),
      }
    })
    .filter(Boolean)
    .sort(
      (a, b) =>
        INDICADORES_COMPARATIVO.indexOf(a.nome) -
        INDICADORES_COMPARATIVO.indexOf(b.nome),
    )

  return comparativos
}
