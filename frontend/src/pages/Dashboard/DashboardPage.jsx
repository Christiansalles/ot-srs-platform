import { useEffect, useState } from 'react'

import CardIndicador from '../../components/CardIndicador/CardIndicador'
import GraficoSerieHistorica from '../../components/GraficoSerieHistorica/GraficoSerieHistorica'
import { getDestaques, getIndicadores } from '../../services/api'
import GraficoDistribuicaoSetor from '../../components/GraficoDistribuicaoSetor/GraficoDistribuicaoSetor'
import GraficoComparativoAnual from '../../components/GraficoComparativoAnual/GraficoComparativoAnual'

import {
  montarDistribuicao,
  periodoMaisRecente,
} from '../../utils/montarDistribuicao'

import {
  montarComparativoAnual,
} from '../../utils/montarComparativoAnual'

import { montarCards } from '../../utils/montarCards'

import './DashboardPage.css'

const NOTA_DISTRIBUICAO =
  'Metodologia: Mapeamento contínuo SMCELT & COMTUR Santa Rita do Sapucaí'

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

        setEstado({
          status: 'ready',
          cards,
          indicadores,
          distribuicao: montarDistribuicao(indicadores),
          ano: periodoMaisRecente(indicadores)?.ano,
          comparativoAnual: montarComparativoAnual(indicadores),
        })
      })
      .catch(() => {
        if (active) setEstado({ status: 'error' })
      })

    return () => {
      active = false
    }
  }, [])

  const { status, cards, indicadores, distribuicao, ano, comparativoAnual } = estado

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

            {indicadores && (
              <section
                className="dashboard__chart"
                aria-label="Gráfico de série histórica"
              >
                <GraficoSerieHistorica
                  indicadores={indicadores}
                  subtitulo="Série histórica observada no município"
                />
              </section>
            )}
            <div className="dashboard__graficos">
              <GraficoDistribuicaoSetor
                dados={distribuicao}
                ano={ano}
                nota={NOTA_DISTRIBUICAO}
              />
              <GraficoComparativoAnual
                dados={comparativoAnual}
              />
            </div>
            
          </>
        )}
      </div>
    </div>
  )
}

export default DashboardPage
