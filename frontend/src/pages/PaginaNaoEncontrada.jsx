import { Link } from 'react-router-dom';
import './PaginaNaoEncontrada.css';

export default function PaginaNaoEncontrada() {
  return (
    <div className="page">
      <header className="page-heading">
        <p className="eyebrow">Erro 404</p>
        <h1>Página não encontrada</h1>
        <p>Confira o endereço ou volte à página inicial do Observatório.</p>
      </header>
      <Link className="ot-button-primary pagina-nao-encontrada__link" to="/">
        Voltar à página inicial
      </Link>
    </div>
  );
}
