import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AUTH_UNAUTHORIZED_EVENT, getToken } from '../services/auth';

function RotaProtegida() {
  const [sessaoExpirada, setSessaoExpirada] = useState(false);

  useEffect(() => {
    function handleUnauthorized() {
      setSessaoExpirada(true);
    }

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
  }, []);

  if (!getToken() || sessaoExpirada) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}

export default RotaProtegida;
