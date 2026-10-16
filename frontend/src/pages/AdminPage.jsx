import { Navigate, useNavigate } from 'react-router-dom';
import { getUsuarioLogado, logout } from '../services/auth';

function AdminPage() {
  const navigate = useNavigate();
  const usuario = getUsuarioLogado();

  if (!usuario) return <Navigate to="/admin/login" replace />;

  function handleLogout() {
    logout();
    navigate('/admin/login', { replace: true });
  }

  return (
    <main className="page-shell">
      <section className="page" aria-labelledby="admin-heading">
        <div className="section-header">
          <div>
            <p className="eyebrow">Área administrativa</p>
            <h1 id="admin-heading">Olá, {usuario.nome}</h1>
          </div>
          <button className="ot-button-secondary" onClick={handleLogout} type="button">Sair</button>
        </div>
        <p className="state-message">Você entrou no painel administrativo do Observatório do Turismo.</p>
      </section>
    </main>
  );
}

export default AdminPage;
