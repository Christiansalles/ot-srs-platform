import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AUTH_UNAUTHORIZED_EVENT, getToken, getUsuarioAutenticado } from '../services/auth';

function RotaProtegida() {
  const [sessaoExpirada, setSessaoExpirada] = useState(false);
  const [verificandoSessao, setVerificandoSessao] = useState(Boolean(getToken()));
  const [erroVerificacao, setErroVerificacao] = useState('');

  useEffect(() => {
    function handleUnauthorized() {
      setSessaoExpirada(true);
    }

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
  }, []);

  useEffect(() => {
    if (!getToken()) return undefined;

    let mounted = true;
    getUsuarioAutenticado()
      .then(() => {
        if (mounted) setErroVerificacao('');
      })
      .catch((error) => {
        if (mounted && getToken()) setErroVerificacao(error.message);
      })
      .finally(() => {
        if (mounted) setVerificandoSessao(false);
      });

    return () => { mounted = false; };
  }, []);

  if (!getToken() || sessaoExpirada) {
    return <Navigate to="/admin/login" replace />;
  }

  if (verificandoSessao) return <p role="status">Verificando sessão...</p>;
  if (erroVerificacao) return <p role="alert">{erroVerificacao}</p>;

  return <Outlet />;
}

export default RotaProtegida;
