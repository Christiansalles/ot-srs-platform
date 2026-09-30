import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import './App.css';
import HomePage from './pages/HomePage';
import IndicadoresPage from './pages/IndicadoresPage';
import DashboardPage from './pages/DashboardPage';
import RelatoriosPage from './pages/RelatoriosPage';

function AppLayout() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <span className="brand-mark">SRS</span>
          <div>
            <strong>Observatório do Turismo</strong>
            <small>Setor de Hospedagem</small>
          </div>
        </div>

        <nav className="main-nav" aria-label="Navegação principal">
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/indicadores">Indicadores</NavLink>
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/relatorios">Relatórios</NavLink>
        </nav>
      </header>

      <main className="page-shell">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/indicadores" element={<IndicadoresPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/relatorios" element={<RelatoriosPage />} />
        </Routes>
      </main>

      <footer className="footer-bar">
        <span>Dados públicos · Hospedagem</span>
        <span>Portal de indicadores</span>
      </footer>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;
