import { useId, useMemo, useState } from 'react'
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

import { INDICADORES, ORDEM_DASHBOARD } from '../../config/indicadores'
import { formatarValor } from '../../utils/formatarValor'

import './GraficoSerieHistorica.css'

function nomeAbreviado(nome) {
  const nomes = {
    [INDICADORES.LEITOS]: 'Leitos',
    [INDICADORES.VISITANTES]: 'Visitantes',
    [INDICADORES.EMPRESAS]: 'Empresas',
    [INDICADORES.EMPREGOS]: 'Empregos',
  }

  return nomes[nome] ?? nome
}

function tituloDoIndicador(nome) {
  const titulos = {
    [INDICADORES.LEITOS]: 'Evolução do número de leitos',
    [INDICADORES.VISITANTES]: 'Evolução do número de visitantes',
    [INDICADORES.EMPRESAS]: 'Evolução do número de empresas',
    [INDICADORES.EMPREGOS]: 'Evolução dos empregos no setor',
  }

  return titulos[nome] ?? `Evolução: ${nome}`
}

export function TooltipSerieHistorica({ active, payload }) {
  if (!active || !payload?.length) return null

  const ponto = payload[0].payload

  return (
    <div className="grafico-serie__tooltip">
      <p className="grafico-serie__tooltip-titulo">
        {ponto.periodo}
      </p>

      <div className="grafico-serie__tooltip-item">
        <span className="grafico-serie__tooltip-indicador" />

        <div>
          <span className="grafico-serie__tooltip-label">
            Valor
          </span>

          <span className="grafico-serie__tooltip-valor">
            {formatarValor(ponto.valor, ponto.unidade)}
          </span>
        </div>
      </div>
    </div>
  )
}

function GraficoSerieHistorica({
  indicadores = [],
  titulo = 'Evolução do indicador',
  subtitulo = 'Série histórica observada no município',
}) {
  const idBase = useId()
  const idLinha = `${idBase}linha`
  const idArea = `${idBase}area`

  const [indicadorSelecionado, setIndicadorSelecionado] = useState(
    INDICADORES.VISITANTES,
  )

  const indicadoresComHistorico = useMemo(
    () =>
      ORDEM_DASHBOARD
        .map((nome) =>
          indicadores.find(
            (indicador) => indicador.nome === nome,
          ),
        )
        .filter(
          (indicador) =>
            indicador?.medicoes?.length > 0,
        ),
    [indicadores],
  )

  const nomeSelecionado = indicadoresComHistorico.some(
    (indicador) => indicador.nome === indicadorSelecionado,
  )
    ? indicadorSelecionado
    : indicadoresComHistorico[0]?.nome

  const serieSelecionada = indicadoresComHistorico.find(
    (indicador) => indicador.nome === nomeSelecionado,
  )

  const unidadeSelecionada = serieSelecionada?.unidade

  const dados = useMemo(
    () =>
      (serieSelecionada?.medicoes ?? []).map((medicao) => ({
        periodo: `${medicao.ano}/${medicao.semestre}`,
        valor: medicao.valor,
        unidade: unidadeSelecionada,
      })),
    [serieSelecionada, unidadeSelecionada],
  )

  const tituloGrafico = serieSelecionada
    ? tituloDoIndicador(serieSelecionada.nome)
    : titulo

  return (
    <section
      className="grafico-serie"
      aria-label="Série histórica do indicador"
    >
      <header className="grafico-serie__header">
        <div>
          <h2 className="grafico-serie__title">
            {tituloGrafico}
          </h2>

          <p className="grafico-serie__subtitle">
            {subtitulo}
          </p>
        </div>

        {indicadoresComHistorico.length > 0 && (
          <label className="grafico-serie__seletor">
            <select
              aria-label="Indicador da série histórica"
              value={nomeSelecionado}
              onChange={(event) =>
                setIndicadorSelecionado(event.target.value)
              }
            >
              {indicadoresComHistorico.map((indicador) => (
                <option
                  key={indicador.nome}
                  value={indicador.nome}
                >
                  {nomeAbreviado(indicador.nome)}
                </option>
              ))}
            </select>
          </label>
        )}
      </header>

      {dados.length === 0 ? (
        <div className="grafico-serie__empty">
          Não há dados disponíveis para exibir a série histórica.
        </div>
      ) : (
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
                  id={idLinha}
                  // Evita que a linha desapareça quando todos os valores são iguais.
                  gradientUnits="userSpaceOnUse"
                  x1="0%"
                  y1="0"
                  x2="100%"
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
                  id={idArea}
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
                content={<TooltipSerieHistorica />}
                cursor={{
                  stroke: 'var(--color-border)',
                  strokeDasharray: '4 4',
                }}
              />

              <Area
                type="monotone"
                dataKey="valor"
                stroke="none"
                fill={`url(#${idArea})`}
                tooltipType="none"
              />

              <Line
                type="monotone"
                dataKey="valor"
                name="Valor"
                stroke={`url(#${idLinha})`}
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
      )}
    </section>
  )
}

export default GraficoSerieHistorica
