import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import './App.css';
import HomePage from './pages/HomePage';
import IndicadoresPage from './pages/IndicadoresPage';
import Dashboard from './pages/Dashboard/Dashboard';
import RelatoriosPage from './pages/RelatoriosPage';
import cidadeLogo from './assets/logos/santa-rita.svg';
import observatorioLogo from './assets/logos/observatorio.png';
import prefeituraLogo from './assets/logos/prefeitura.png';
import smceltLogo from './assets/logos/smcelt.png';
import comturLogo from './assets/logos/comtur.png';
import mantiqueiraLogo from './assets/logos/mantiqueira.png';
import minasLogo from './assets/logos/minas.png';

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
          <img className="brand-logo" src={cidadeLogo} alt="Santa Rita do Sapucaí — Cidade Criativa" />
          <div><img className="observatorio-logo" src={observatorioLogo} alt="Observatório do Turismo de Santa Rita do Sapucaí" /><p>Dados abertos para o desenvolvimento turístico do município.</p></div>
        </div>
        <div><strong>Realização e apoio</strong><div className="institutional-logos">
          <img src={prefeituraLogo} alt="Prefeitura Municipal de Santa Rita do Sapucaí" />
          <img src={smceltLogo} alt="Secretaria de Cultura, Esporte, Lazer e Turismo — SMCELT" />
          <img src={comturLogo} alt="Conselho Municipal de Turismo — COMTUR" />
        </div></div>
        <div><strong>Contexto regional</strong><div className="institutional-logos">
          <img src={mantiqueiraLogo} alt="Circuito Turístico Caminhos da Mantiqueira" />
          <img src={minasLogo} alt="Minas Gerais" />
        </div></div>
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
