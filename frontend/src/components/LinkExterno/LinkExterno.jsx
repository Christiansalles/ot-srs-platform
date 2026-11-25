import './LinkExterno.css';

// Link para site de fora do Observatório: abre em aba nova e avisa o leitor de tela,
// porque a troca de aba sem aviso desorienta quem não vê a tela (WCAG 3.2.5).
export default function LinkExterno({ href, children, className = '' }) {
  return (
    <a
      className={`link-externo ${className}`.trim()}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}{' '}
      <span className="sr-only">(abre em nova aba)</span>
      <svg className="link-externo__icone" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
      </svg>
    </a>
  );
}
