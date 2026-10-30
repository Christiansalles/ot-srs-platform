import { BrowserRouter, Link, NavLink, Outlet, Route, Routes } from 'react-router-dom';
import './App.css';
import HomePage from './pages/HomePage';
import IndicadoresPage from './pages/IndicadoresPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import RelatoriosPage from './pages/RelatoriosPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminPage from './pages/AdminPage';
import AdminMedicaoFormPage from './pages/AdminMedicaoFormPage';
import RotaProtegida from './components/RotaProtegida';
import AdminLayout from './components/AdminLayout/AdminLayout';
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
          <img src={smceltLogo} alt="Secretaria Municipal de Cultura, Esporte, Lazer e Turismo (SMCELT)" />
          <img src={comturLogo} alt="Conselho Municipal de Turismo (COMTUR)" />
        </div></div>
        <div><strong>Contexto regional</strong><div className="institutional-logos">
          <img src={mantiqueiraLogo} alt="Circuito Turístico Caminhos da Mantiqueira" />
          <img src={minasLogo} alt="Minas Gerais" />
        </div><p>Vale da Eletrônica</p></div>
      </footer>
    </div>
  );
}

// Provisório até a Tela 8 (#182) entrar no layout.
function AdminEmBreve({ titulo }) {
  return (
    <section className="page" aria-labelledby="admin-em-breve">
      <h1 id="admin-em-breve">{titulo}</h1>
      <p className="state-message">Em construção.</p>
    </section>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route element={<RotaProtegida />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminPage />} />
            <Route path="medicoes/nova" element={<AdminMedicaoFormPage />} />
            <Route path="medicoes/:id/editar" element={<AdminMedicaoFormPage />} />
            <Route path="relatorios" element={<AdminEmBreve titulo="Relatórios" />} />
          </Route>
        </Route>
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
