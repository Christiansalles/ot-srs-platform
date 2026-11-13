import './PularParaConteudo.css';

// Primeira parada do Tab (WCAG 2.4.1): leva o foco ao conteúdo sem passar pelo menu.
// O foco vai por script, e não pelo #âncora, para a URL (com os filtros) não mudar.
export default function PularParaConteudo({ alvo }) {
  function pular(evento) {
    const conteudo = document.getElementById(alvo);
    if (!conteudo) return;
    evento.preventDefault();
    conteudo.focus();
  }

  return (
    <a className="pular-para-conteudo" href={`#${alvo}`} onClick={pular}>
      Pular para o conteúdo
    </a>
  );
}
