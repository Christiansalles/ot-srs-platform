import CardIndicador from '../../components/CardIndicador/CardIndicador'
import './Dashboard.css'

function Dashboard() {
  return (
    <main className="dashboard">
      <header className="dashboard__header">
        <h1>Dashboard</h1>
        <p>Observatório do Turismo de Santa Rita do Sapucaí</p>
      </header>

      <section className="dashboard__indicators">
        <CardIndicador
          name="Número de leitos"
          value="350"
          unit="leitos"
          variation={12}
        />
      </section>
    </main>
  )
}

export default Dashboard