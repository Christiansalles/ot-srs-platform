import { useEffect, useState } from 'react'

import CardIndicador from '../../components/CardIndicador/CardIndicador'
import GraficoSerieHistorica from '../../components/GraficoSerieHistorica/GraficoSerieHistorica'
import { getDestaques, getIndicadores } from '../../services/api'

import './DashboardPage.css'

const SETOR = 'Hospedagem'
const INDICADOR = 'Número de leitos'

function DashboardPage() {
  const [estado, setEstado] = useState({ status: 'loading' })

  useEffect(() => {
    let active = true

    Promise.all([getIndicadores(), getDestaques()])
      .then(([indicadores, destaques]) => {
        if (!active) return

        const indicador = indicadores.find(
          (item) => item.nome === INDICADOR && item.setor.nome === SETOR,
        )
        const destaque = indicador
          ? destaques.find((item) => item.id === indicador.id)
          : undefined

        if (!indicador || !destaque || indicador.medicoes.length === 0) {
          setEstado({ status: 'empty' })
          return
        }

        setEstado({ status: 'ready', indicador, destaque })
      })
      .catch(() => {
        if (active) setEstado({ status: 'error' })
      })

    return () => {
      active = false
    }
  }, [])

  const { status, indicador, destaque } = estado

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <h1>Dashboard</h1>

        <p>
          Observatório do Turismo de Santa Rita do Sapucaí
        </p>
      </header>

      <div aria-live="polite">
        {status === 'loading' && (
          <p className="state-message dashboard__state">
            Carregando indicadores...
          </p>
        )}

        {status === 'error' && (
          <p className="state-message error dashboard__state" role="alert">
            Não foi possível carregar o dashboard agora.
          </p>
        )}

        {status === 'empty' && (
          <p className="state-message dashboard__state">
            Sem dados de hospedagem disponíveis no momento.
          </p>
        )}

        {status === 'ready' && (
          <>
            <section
              className="dashboard__indicators"
              aria-label="Indicadores turísticos"
            >
              <CardIndicador
                name={destaque.nome}
                value={destaque.valor}
                unit={destaque.unidade}
                periodo={destaque.periodo}
                variation={destaque.variacao_percentual}
              />
            </section>

            <section
              className="dashboard__chart"
              aria-label="Gráfico de série histórica"
            >
              <GraficoSerieHistorica
                titulo={`Evolução do ${indicador.nome.toLowerCase()}`}
                subtitulo="Série histórica observada no município"
                medicoes={indicador.medicoes}
              />
            </section>
          </>
        )}
      </div>
    </div>
  )
}

export default DashboardPage
