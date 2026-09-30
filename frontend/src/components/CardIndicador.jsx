function formatVariation(value) {
  if (value === null || value === undefined) {
    return 'Sem variação';
  }

  const signal = value > 0 ? '+' : '';
  return `${signal}${value.toFixed(1)}%`;
}

export default function CardIndicador({
  nome,
  valor,
  unidade,
  variacaoPercentual,
  periodo,
}) {
  const variationLabel = formatVariation(variacaoPercentual);
  const variationClass =
    variacaoPercentual === null || variacaoPercentual === undefined
      ? 'neutral'
      : variacaoPercentual >= 0
        ? 'up'
        : 'down';

  return (
    <article className="indicador-card">
      <div className="card-header">
        <span className="card-label">Indicador</span>
        <span className={`card-trend ${variationClass}`}>{variationLabel}</span>
      </div>

      <h3>{nome}</h3>

      <div className="card-value-row">
        <strong>{valor}</strong>
        <span>{unidade}</span>
      </div>

      {periodo ? (
        <p className="card-periodo">
          Período {periodo.ano}/{periodo.semestre}
        </p>
      ) : null}
    </article>
  );
}
