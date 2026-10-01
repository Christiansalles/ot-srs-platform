import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import './GraficoSerieHistorica.css'

function GraficoSerieHistorica({
  medicoes = [],
  titulo = 'Evolução do indicador',
  subtitulo = 'Série histórica observada no município',
}) {
  if (medicoes.length === 0) {
    return (
      <section
        className="grafico-serie"
        aria-label="Série histórica do indicador"
      >
        <header className="grafico-serie__header">
          <div>
            <h2 className="grafico-serie__title">
              {titulo}
            </h2>

            <p className="grafico-serie__subtitle">
              {subtitulo}
            </p>
          </div>
        </header>

        <div className="grafico-serie__empty">
          Não há dados disponíveis para exibir a série histórica.
        </div>
      </section>
    )
  }

  const dados = medicoes.map((medicao) => ({
    periodo: `${medicao.ano}/${medicao.semestre}`,
    valor: medicao.valor,
  }))

  return (
    <section
      className="grafico-serie"
      aria-label="Série histórica do indicador"
    >
      <header className="grafico-serie__header">
        <div>
          <h2 className="grafico-serie__title">
            {titulo}
          </h2>

          <p className="grafico-serie__subtitle">
            {subtitulo}
          </p>
        </div>
      </header>

      <div className="grafico-serie__chart">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={dados}
            margin={{
              top: 20,
              right: 20,
              left: 0,
              bottom: 10,
            }}
          >
            <defs>
              <linearGradient
                id="grafico-linha"
                x1="0"
                y1="0"
                x2="1"
                y2="0"
              >
                <stop
                  offset="0%"
                  stopColor="var(--color-primary)"
                />

                <stop
                  offset="50%"
                  stopColor="var(--chart-sky)"
                />

                <stop
                  offset="100%"
                  stopColor="var(--color-secondary)"
                />
              </linearGradient>

              <linearGradient
                id="grafico-area"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="var(--chart-sky)"
                  stopOpacity={0.25}
                />

                <stop
                  offset="100%"
                  stopColor="var(--chart-sky)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="var(--color-border)"
              strokeOpacity={0.55}
              vertical={false}
            />

            <XAxis
              dataKey="periodo"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: 'var(--color-text-muted)',
                fontSize: 12,
                fontWeight: 600,
              }}
              padding={{
                left: 5,
                right: 5,
              }}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{
                fill: 'var(--color-text-muted)',
                fontSize: 12,
              }}
              width={45}
            />

            <Tooltip
              contentStyle={{
                border: '1px solid var(--color-border)',
                borderRadius: '10px',
                boxShadow:
                  '0 4px 16px rgba(15, 23, 42, 0.08)',
              }}
              labelStyle={{
                color: 'var(--color-text)',
                fontWeight: 700,
              }}
            />

            <Area
              type="monotone"
              dataKey="valor"
              stroke="none"
              fill="url(#grafico-area)"
              tooltipType="none"
            />

            <Line
              type="monotone"
              dataKey="valor"
              name="Valor"
              stroke="url(#grafico-linha)"
              strokeWidth={3}
              dot={{
                r: 6,
                fill: 'var(--color-secondary)',
                strokeWidth: 0,
              }}
              activeDot={{
                r: 7,
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

export default GraficoSerieHistorica