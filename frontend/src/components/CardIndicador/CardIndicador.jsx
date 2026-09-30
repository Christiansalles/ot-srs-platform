import './CardIndicador.css'

function CardIndicador({
  name,
  value,
  unit,
  variation,
}) {
  const isPositive = variation >= 0

  return (
    <article className="card-indicador">
      <h2 className="card-indicador__name">
        {name}
      </h2>

      <div className="card-indicador__value">
        {value}
      </div>

      <p className="card-indicador__unit">
        {unit}
      </p>

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
    </article>
  )
}

export default CardIndicador