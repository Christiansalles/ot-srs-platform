import { useState } from 'react';
import { Link, Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { getUsuarioLogado, logout } from '../../services/auth';
import './AdminLayout.css';

// Perfis definidos no contrato do M6; usuários antigos ainda não trazem o campo.
const PERFIS = { admin: 'Administrador', editor: 'Editor' };

const MENU = [
  {
    to: '/admin',
    end: true,
    label: 'Painel de gestão',
    icon: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18M9 12h12" /></>,
  },
  {
    to: '/admin/medicoes',
    label: 'Cadastrar medição',
    icon: <><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /></>,
  },
  {
    to: '/admin/relatorios',
    label: 'Relatórios',
    icon: <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z" /><path d="M14 3v6h6M8 13h8M8 17h5" /></>,
  },
];

function iniciais(nome) {
  return nome.split(/\s+/).filter(Boolean).slice(0, 2).map((parte) => parte[0].toUpperCase()).join('');
}

function AdminLayout() {
  const navigate = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);
  const usuario = getUsuarioLogado();

  if (!usuario) return <Navigate to="/admin/login" replace />;

  const perfil = PERFIS[usuario.perfil] ?? PERFIS.admin;

  function handleLogout() {
    logout();
    navigate('/admin/login', { replace: true });
  }

  return (
    <div className={`admin-shell${menuAberto ? ' admin-shell--menu-aberto' : ''}`}>
      <aside className="admin-sidebar" id="admin-menu">
        <div className="admin-brand">
          <span className="admin-brand-emblem" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M3 19l6-8 4 5 3-3 5 6H3Z" /></svg>
          </span>
          <div>
            <strong>OT-SRS <span>Gestor</span></strong>
            <small>Backoffice Municipal</small>
          </div>
        </div>

        <nav className="admin-nav" aria-label="Menu administrativo">
          <p className="admin-nav-title">Módulos de gestão</p>
          {MENU.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setMenuAberto(false)}>
              <svg viewBox="0 0 24 24" aria-hidden="true">{item.icon}</svg>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <Link className="admin-portal-link" to="/">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>
          Ver Portal Público
        </Link>
      </aside>

      {menuAberto && <div className="admin-overlay" aria-hidden="true" onClick={() => setMenuAberto(false)} />}

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            aria-controls="admin-menu"
            aria-expanded={menuAberto}
            aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
            className="admin-menu-toggle"
            onClick={() => setMenuAberto((aberto) => !aberto)}
            type="button"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              {menuAberto ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>

          <p className="admin-topbar-title">Painel de Gestão Municipal</p>

          <div className="admin-user">
            <span className="admin-user-avatar" aria-hidden="true">{iniciais(usuario.nome)}</span>
            <div className="admin-user-info">
              <strong>{usuario.nome}</strong>
              <span>{perfil}</span>
            </div>
            <button className="admin-logout" onClick={handleLogout} type="button">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" /></svg>
              Sair
            </button>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
