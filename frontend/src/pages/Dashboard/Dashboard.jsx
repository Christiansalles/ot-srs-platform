import CardIndicador from '../../components/CardIndicador/CardIndicador'
import GraficoSerieHistorica from '../../components/GraficoSerieHistorica/GraficoSerieHistorica'

import './Dashboard.css'

function Dashboard() {
  const medicoesLeitos = [
    {
      ano: 2023,
      semestre: 2,
      valor: 280,
    },
    {
      ano: 2024,
      semestre: 2,
      valor: 312,
    },
    {
      ano: 2025,
      semestre: 2,
      valor: 350,
    },
  ]

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <h1>Dashboard</h1>

        <p>
          Observatório do Turismo de Santa Rita do Sapucaí
        </p>
      </header>

      <section
        className="dashboard__indicators"
        aria-label="Indicadores turísticos"
      >
        <CardIndicador
          name="Número de leitos"
          value={350}
          unit="leitos"
          periodo={{ ano: 2025, semestre: 2 }}
          variation={12}
        />
      </section>

      <section
        className="dashboard__chart"
        aria-label="Gráfico de série histórica"
      >
        <GraficoSerieHistorica
          titulo="Evolução do número de leitos"
          subtitulo="Série histórica anual observada no município"
          medicoes={medicoesLeitos}
        />
      </section>
    </div>
  )
}

export default Dashboard
