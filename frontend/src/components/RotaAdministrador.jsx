import { Navigate, Outlet } from 'react-router-dom';
import { getUsuarioLogado } from '../services/auth';

function RotaAdministrador() {
  if (getUsuarioLogado()?.perfil !== 'administrador') return <Navigate to="/admin" replace />;
  return <Outlet />;
}

export default RotaAdministrador;
