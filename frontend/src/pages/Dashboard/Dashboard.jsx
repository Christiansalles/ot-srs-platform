import CardIndicador from '../../components/CardIndicador/CardIndicador'
import './Dashboard.css'

function Dashboard() {
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

        <CardIndicador
          name="Número de visitantes"
          value="1.240"
          unit="visitantes"
          periodo="2025/2"
          variation={-5}
        />

        <CardIndicador
          name="Taxa de ocupação"
          value="68"
          unit="ocupação"
          periodo="2025/2"
          variation={null}
        />
      </section>
    </div>
  )
}

export default Dashboard
