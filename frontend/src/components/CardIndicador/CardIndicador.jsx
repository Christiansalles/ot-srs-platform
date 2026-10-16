import { separarValor } from '../../utils/formatarValor'

import './CardIndicador.css'

// Aceita "2025/2" (texto) ou { ano: 2025, semestre: 2 } (formato da API)
function formatPeriodo(periodo) {
  if (!periodo) return ''
  if (typeof periodo === 'string') return periodo
  return `${periodo.ano}/${periodo.semestre}`
}

function CardIndicador({
  name,
  value,
  unit,
  periodo,
  variation,
}) {
  const hasVariation = variation !== null && variation !== undefined
  const isPositive = hasVariation && variation >= 0
  const { principal, rotulo } = separarValor(value, unit)

  return (
    <article className="card-indicador">
      <header className="card-indicador__header">
        <div>
          <h2 className="card-indicador__name">
            {name}
          </h2>

          <span className="card-indicador__periodo">
            {formatPeriodo(periodo)}
          </span>
        </div>
      </header>

      <div className="card-indicador__value">
        {principal}

        {rotulo && (
          <>
            {' '}
            <span className="card-indicador__unit">{rotulo}</span>
          </>
        )}
      </div>

      {hasVariation ? (
        <div
          className={`card-indicador__variation ${
            isPositive
              ? 'card-indicador__variation--positive'
              : 'card-indicador__variation--negative'
          }`}
        >
          <span aria-hidden="true">
            {isPositive ? '↑' : '↓'}
          </span>

          <strong>
            {Math.abs(variation).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%
          </strong>

          <span>vs. período anterior</span>
        </div>
      ) : (
        <div className="card-indicador__variation card-indicador__variation--unavailable">
          <span>Sem período anterior</span>
        </div>
      )}
    </article>
  )
}

export default CardIndicador
