import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/auth';
import './AdminLoginPage.css';

function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      await login(email.trim(), senha);
      navigate('/admin', { replace: true });
    } catch (error) {
      setErro(error.message || 'Não foi possível entrar. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="admin-login-page">
      <div className="admin-login-shell">
        <section className="admin-login-brand" aria-label="Identidade do Observatório do Turismo">
          <span className="admin-login-secure">
            <span className="admin-login-secure-dot" aria-hidden="true" />
            Ambiente seguro
          </span>

          <div className="admin-login-brand-center">
            <div className="admin-login-emblem" aria-hidden="true">
              <svg viewBox="0 0 48 48" fill="none">
                <path d="M24 8v3M16 11l2 2.5M32 11l-2 2.5" />
                <circle cx="24" cy="18" r="4.5" />
                <path d="M7 36l12-15 8 9 6-6 8 12H7Z" />
                <path d="M5 38l13-16 9 10 7-8 9 14H5Z" />
              </svg>
            </div>
            <h1>OT-SRS</h1>
            <p className="admin-login-brand-name">Observatório do Turismo</p>
            <p className="admin-login-location">Santa Rita do Sapucaí <span aria-hidden="true">•</span> MG</p>
          </div>

          <div className="admin-login-brand-footer">
            <p>“Gestão de dados para um turismo mais forte.”</p>
            <span>Vale da Eletrônica <span aria-hidden="true">•</span> Cidade Criativa</span>
          </div>
        </section>

        <section className="admin-login-form-panel" aria-labelledby="admin-login-title">
          <div className="admin-login-form-content">
            <header className="admin-login-card-heading">
              <span className="admin-login-eyebrow">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 4 5v6c0 5.1 3.4 9.3 8 11 4.6-1.7 8-5.9 8-11V5l-8-3Zm0 4a3 3 0 0 1 3 3v1h1v6H8v-6h1V9a3 3 0 0 1 3-3Zm-1 4h2V9a1 1 0 0 0-2 0v1Z" /></svg>
                Backoffice municipal
              </span>
              <h2 id="admin-login-title">Acesso Administrativo</h2>
              <p>Faça login para acessar o painel de gestão.</p>
            </header>

            <form className="admin-login-form" onSubmit={handleSubmit}>
              <div className="admin-login-field">
                <label htmlFor="admin-email">E-mail</label>
                <div className="admin-login-input-wrap">
                  <svg className="admin-login-input-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16v12H4zM4 7l8 6 8-6" /></svg>
                  <input
                    autoComplete="username"
                    id="admin-email"
                    name="email"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="seu@email.com"
                    required
                    type="email"
                    value={email}
                  />
                </div>
              </div>

              <div className="admin-login-field">
                <label htmlFor="admin-password">Senha</label>
                <div className="admin-login-input-wrap">
                  <svg className="admin-login-input-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 10V7a6 6 0 0 1 12 0v3M5 10h14v11H5zM12 14v3" /></svg>
                  <input
                    autoComplete="current-password"
                    id="admin-password"
                    name="senha"
                    onChange={(event) => setSenha(event.target.value)}
                    placeholder="Sua senha"
                    required
                    type={mostrarSenha ? 'text' : 'password'}
                    value={senha}
                  />
                  <button
                    aria-label={mostrarSenha ? 'Esconder senha' : 'Mostrar senha'}
                    className="admin-login-password-toggle"
                    onClick={() => setMostrarSenha((atual) => !atual)}
                    type="button"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      {mostrarSenha
                        ? <><path d="M3 3l18 18" /><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.9 5.2A10.7 10.7 0 0 1 12 5c5 0 8.5 4.2 9.5 7-.4 1.1-1.2 2.3-2.3 3.3M6.2 6.2C4.3 7.5 3 9.5 2.5 12c1 2.8 4.5 7 9.5 7 1 0 2-.2 2.9-.5" /></>
                        : <><path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" /><circle cx="12" cy="12" r="3" /></>}
                    </svg>
                  </button>
                </div>
              </div>

              {erro && <p className="admin-login-error" role="alert">{erro}</p>}

              <button className="admin-login-submit" disabled={carregando} type="submit">
                {carregando ? (
                  <><span className="admin-login-spinner" aria-hidden="true" />Entrando...</>
                ) : (
                  <>Entrar <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg></>
                )}
              </button>
            </form>

            <div className="admin-login-institution">
              <span className="admin-login-institution-name">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></svg>
                Prefeitura Municipal de Santa Rita do Sapucaí
              </span>
              <span className="admin-login-department">SMCELT</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default AdminLoginPage;
