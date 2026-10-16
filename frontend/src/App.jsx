import { BrowserRouter, Link, NavLink, Outlet, Route, Routes } from 'react-router-dom';
import './App.css';
import HomePage from './pages/HomePage';
import IndicadoresPage from './pages/IndicadoresPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import RelatoriosPage from './pages/RelatoriosPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminPage from './pages/AdminPage';
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
        <Link className="ot-button-primary topbar-admin-link" to="/admin/login">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="5" y="10" width="14" height="11" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
          Acesso Administrativo
        </Link>
      </header>

      <main className="page-shell">
        <Outlet />
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
      <Routes>
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/indicadores" element={<IndicadoresPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/relatorios" element={<RelatoriosPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
