const MOEDA = 'R$'
const PERCENTUAL = '%'

function formatarNumero(valor, unidade) {
  if (valor === null || valor === undefined) return ''

  // Texto já formatado (ex.: "1.240") é mantido como está.
  if (typeof valor !== 'number') return String(valor)

  if (unidade === MOEDA) {
    return valor.toLocaleString('pt-BR', {
      minimumFractionDigits: Number.isInteger(valor) ? 0 : 2,
      maximumFractionDigits: 2,
    })
  }

  return valor.toLocaleString('pt-BR')
}

// Separa o que vai junto do número (R$ e %) do rótulo em palavra
// (dias, visitantes, leitos...), para o card poder estilizar cada parte.
export function separarValor(valor, unidade) {
  const numero = formatarNumero(valor, unidade)

  // Sem valor, não mostra nem a unidade.
  if (numero === '') return { principal: '', rotulo: '' }

  if (unidade === MOEDA) return { principal: `${MOEDA} ${numero}`, rotulo: '' }
  if (unidade === PERCENTUAL) return { principal: `${numero}${PERCENTUAL}`, rotulo: '' }

  return { principal: numero, rotulo: unidade ?? '' }
}

export function formatarValor(valor, unidade) {
  const { principal, rotulo } = separarValor(valor, unidade)

  return rotulo ? `${principal} ${rotulo}` : principal
}
