import { Link } from 'react-router-dom';
import { useTituloDaPagina } from '../hooks/useTituloDaPagina';
import './PaginaNaoEncontrada.css';

export default function PaginaNaoEncontrada() {
  useTituloDaPagina('Página não encontrada');
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
