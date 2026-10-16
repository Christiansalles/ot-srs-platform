import {
  INDICADORES,
  ORDEM_DASHBOARD,
} from '../config/indicadores'

const SEM_CARD = [INDICADORES.PARTICIPACAO]

function posicao(nome) {
  const indice = ORDEM_DASHBOARD.indexOf(nome)

  return indice === -1 ? ORDEM_DASHBOARD.length : indice
}

export function montarCards(destaques) {
  return destaques
    .filter((destaque) => !SEM_CARD.includes(destaque.nome))
    .sort((a, b) => posicao(a.nome) - posicao(b.nome))
}
