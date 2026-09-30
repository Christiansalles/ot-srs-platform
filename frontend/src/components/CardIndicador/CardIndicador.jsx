import './CardIndicador.css'

function CardIndicador({
  name,
  value,
  unit,
  periodo,
  variation,
}) {
  const hasVariation = variation !== null && variation !== undefined
  const isPositive = hasVariation && variation >= 0

  return (
    <article className="card-indicador">
      <header className="card-indicador__header">
        <div>
          <h2 className="card-indicador__name">
            {name}
          </h2>

          <span className="card-indicador__periodo">
            {periodo}
          </span>
        </div>
      </header>

      <div className="card-indicador__value">
        {value}
      </div>

      <p className="card-indicador__unit">
        {unit}
      </p>

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

          <strong>{Math.abs(variation)}%</strong>

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