import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { formatarValor } from '../../utils/formatarValor'

import './GraficoComparativoAnual.css'

function nomeAbreviado(nome) {
  const nomes = {
    'Número de leitos': 'Leitos',
    'Fluxo de visitantes': 'Visitantes',
    'Número de empresas': 'Empresas',
    'Empregos no setor': 'Empregos',
  }

  return nomes[nome] ?? nome
}

function TooltipComparativo({ active, payload }) {
  if (!active || !payload?.length) return null

  const dadosIndicador = payload[0].payload

  return (
    <div className="grafico-comparativo__tooltip">
      <p className="grafico-comparativo__tooltip-titulo">
        {dadosIndicador.nome}
      </p>

      <div className="grafico-comparativo__tooltip-item">
        <span className="grafico-comparativo__tooltip-indicador grafico-comparativo__tooltip-indicador--anterior" />

        <div>
          <span className="grafico-comparativo__tooltip-ano">
            {dadosIndicador.anoAnterior}
          </span>

          <span className="grafico-comparativo__tooltip-valor">
            {formatarValor(
              dadosIndicador.valorAnterior,
              dadosIndicador.unidade,
            )}
          </span>

          <span className="grafico-comparativo__tooltip-percentual">
            ({dadosIndicador.anterior.toFixed(1)}%)
          </span>
        </div>
      </div>

      <div className="grafico-comparativo__tooltip-item">
        <span className="grafico-comparativo__tooltip-indicador grafico-comparativo__tooltip-indicador--atual" />

        <div>
          <span className="grafico-comparativo__tooltip-ano">
            {dadosIndicador.anoAtual}
          </span>

          <span className="grafico-comparativo__tooltip-valor">
            {formatarValor(
              dadosIndicador.valorAtual,
              dadosIndicador.unidade,
            )}
          </span>

          <span className="grafico-comparativo__tooltip-percentual">
            ({dadosIndicador.atual.toFixed(1)}%)
          </span>
        </div>
      </div>
    </div>
  )
}

function GraficoComparativoAnual({ dados = [] }) {
  const anoAnterior = dados[0]?.anoAnterior
  const anoAtual = dados[0]?.anoAtual

  return (
    <section
      className="grafico-comparativo"
      aria-label="Comparativo anual"
    >
      <header className="grafico-comparativo__header">
        <div>
          <h2 className="grafico-comparativo__title">
            Comparativo anual
          </h2>

          <p className="grafico-comparativo__subtitle">
            Variação das 4 dimensões-chave
          </p>
        </div>

        <div className="grafico-comparativo__legenda">
          <span>
            <i className="grafico-comparativo__legenda-cor grafico-comparativo__legenda-cor--anterior" />
            {anoAnterior}
          </span>

          <span>
            <i className="grafico-comparativo__legenda-cor grafico-comparativo__legenda-cor--atual" />
            {anoAtual}
          </span>
        </div>
      </header>

      {dados.length === 0 ? (
        <div className="grafico-comparativo__empty">
          Não há dados suficientes para comparar os anos.
        </div>
      ) : (
        <div className="grafico-comparativo__chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={dados}
              margin={{
                top: 20,
                right: 10,
                left: 0,
                bottom: 0,
              }}
            >
              <CartesianGrid
                stroke="var(--color-border)"
                strokeOpacity={0.55}
                vertical={false}
              />

              <XAxis
                dataKey="nome"
                tickFormatter={nomeAbreviado}
                // Sem isso o Recharts esconde rótulos quando acha que não
                // cabem, e no celular um par de barras fica sem nome.
                interval={0}
                axisLine={false}
                tickLine={false}
                tick={{
                    fill: 'var(--color-text-muted)',
                    fontSize: 12,
                    fontWeight: 600,
                }}
              />

              <YAxis
                width={40}
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: 'var(--color-text-muted)',
                  fontSize: 11,
                }}
                tickFormatter={(valor) => `${valor}%`}
              />

              <Tooltip
                content={<TooltipComparativo />}
                cursor={{
                    fill: 'var(--color-text)',
                    fillOpacity: 0.04,
                }}
              />

             <Bar
                dataKey="anterior"
                name={String(anoAnterior)}
                fill="var(--chart-cyan)"
                barSize={24}
                radius={[4, 4, 0, 0]}
            />

            <Bar
                dataKey="atual"
                name={String(anoAtual)}
                fill="var(--chart-violet)"
                barSize={24}
                radius={[4, 4, 0, 0]}
            />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}

export default GraficoComparativoAnual
