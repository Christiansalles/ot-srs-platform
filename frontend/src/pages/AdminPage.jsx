import { getUsuarioLogado } from '../services/auth';

function AdminPage() {
  const usuario = getUsuarioLogado();

  return (
    <section className="page" aria-labelledby="admin-heading">
      <div className="section-header">
        <div>
          <p className="eyebrow">Área administrativa</p>
          <h1 id="admin-heading">Olá, {usuario.nome}</h1>
        </div>
      </div>
      <p className="state-message">O painel de gestão dos indicadores está em construção.</p>
    </section>
  );
}

export default AdminPage;
