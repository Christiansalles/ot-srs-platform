const ORDEM_DO_MOCKUP = [
  'Número de leitos',
  'Fluxo de visitantes',
  'Número de empresas',
  'Empregos no setor',
]

// A participação econômica é o dado da rosca, não vira card.
const SEM_CARD = ['Participação econômica']

function posicao(nome) {
  const indice = ORDEM_DO_MOCKUP.indexOf(nome)
  return indice === -1 ? ORDEM_DO_MOCKUP.length : indice
}

export function montarCards(destaques) {
  return destaques
    .filter((destaque) => !SEM_CARD.includes(destaque.nome))
    .sort((a, b) => posicao(a.nome) - posicao(b.nome))
}
