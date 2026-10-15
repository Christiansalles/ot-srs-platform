import { useEffect, useState } from 'react'

import CardIndicador from '../../components/CardIndicador/CardIndicador'
import GraficoSerieHistorica from '../../components/GraficoSerieHistorica/GraficoSerieHistorica'
import { getDestaques, getIndicadores } from '../../services/api'

import { montarCards } from './montarCards'
import './DashboardPage.css'

function DashboardPage() {
  const [estado, setEstado] = useState({ status: 'loading' })

  useEffect(() => {
    let active = true

    Promise.all([getDestaques(), getIndicadores()])
      .then(([destaques, indicadores]) => {
        if (!active) return

        const cards = montarCards(destaques)

        if (cards.length === 0) {
          setEstado({ status: 'empty' })
          return
        }

        // O gráfico mostra a série do primeiro card.
        const serie = indicadores.find((item) => item.id === cards[0].id)

        setEstado({ status: 'ready', cards, serie })
      })
      .catch(() => {
        if (active) setEstado({ status: 'error' })
      })

    return () => {
      active = false
    }
  }, [])

  const { status, cards, serie } = estado

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
            Sem indicadores disponíveis no momento.
          </p>
        )}

        {status === 'ready' && (
          <>
            <section
              className="dashboard__indicators"
              aria-label="Indicadores turísticos"
            >
              {cards.map((destaque) => (
                <CardIndicador
                  key={destaque.id}
                  name={destaque.nome}
                  value={destaque.valor}
                  unit={destaque.unidade}
                  periodo={destaque.periodo}
                  variation={destaque.variacao_percentual}
                />
              ))}
            </section>

            {serie && (
              <section
                className="dashboard__chart"
                aria-label="Gráfico de série histórica"
              >
                <GraficoSerieHistorica
                  titulo={`Evolução: ${serie.nome}`}
                  subtitulo="Série histórica observada no município"
                  unidade={serie.unidade}
                  medicoes={serie.medicoes}
                />
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default DashboardPage