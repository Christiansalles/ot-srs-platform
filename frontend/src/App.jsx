import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import './App.css';
import HomePage from './pages/HomePage';
import IndicadoresPage from './pages/IndicadoresPage';
import Dashboard from './pages/Dashboard/Dashboard';
import RelatoriosPage from './pages/RelatoriosPage';
import cidadeLogo from './assets/logos/santa-rita.svg';
import observatorioLogo from './assets/logos/observatorio.png';
import prefeituraLogo from './assets/logos/prefeitura.png';

function AppLayout() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <img className="brand-logo" src={cidadeLogo} alt="Santa Rita do Sapucaí — Cidade Criativa" />
          <img className="observatorio-logo" src={observatorioLogo} alt="Observatório do Turismo de Santa Rita do Sapucaí" />
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
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/relatorios" element={<RelatoriosPage />} />
        </Routes>
      </main>

      <footer className="footer-bar">
        <div className="footer-brand">
          <div><img className="observatorio-logo" src={observatorioLogo} alt="Observatório do Turismo de Santa Rita do Sapucaí" /><p>Dados abertos para o desenvolvimento turístico do município.</p></div>
        </div>
        <div><strong>Realização e apoio</strong><div className="institutional-logos">
          <img src={prefeituraLogo} alt="Prefeitura Municipal de Santa Rita do Sapucaí" />
        </div><p>SMCELT · Conselho Municipal de Turismo (COMTUR)</p></div>
        <div><strong>Contexto regional</strong><p>Circuito Turístico Caminhos da Mantiqueira<br />Minas Gerais · Vale da Eletrônica</p></div>
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
