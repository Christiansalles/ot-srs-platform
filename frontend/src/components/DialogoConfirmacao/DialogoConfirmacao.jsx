import { useId, useLayoutEffect, useRef } from 'react';
import './DialogoConfirmacao.css';

// Monte só enquanto houver o que confirmar. O <dialog> nativo prende o foco, fecha com Esc
// e devolve o foco ao botão que o abriu.
function DialogoConfirmacao({ titulo, destaque, descricao, rotuloConfirmar, enviando = false, onConfirmar, onCancelar }) {
  const dialogo = useRef(null);
  const idTitulo = useId();
  const idDescricao = useId();

  // Layout effect: o close precisa rodar antes de o React tirar o <dialog> da página,
  // senão o navegador não devolve o foco.
  useLayoutEffect(() => {
    const elemento = dialogo.current;
    elemento.showModal();
    return () => elemento.close();
  }, []);

  function cancelar() {
    if (!enviando) onCancelar();
  }

  return (
    <dialog
      ref={dialogo}
      className="dialogo-confirmacao"
      aria-labelledby={idTitulo}
      aria-describedby={idDescricao}
      onCancel={(evento) => {
        evento.preventDefault();
        cancelar();
      }}
      onClose={() => {
        // Uma segunda tecla Esc fecha o <dialog> mesmo com o preventDefault do onCancel.
        // O evento chega depois: o StrictMode reabre na montagem, e aí não há o que fazer.
        const elemento = dialogo.current;
        if (!elemento || elemento.open) return;
        if (enviando) elemento.showModal();
        else onCancelar();
      }}
      onClick={(evento) => {
        // O clique no fundo escurecido chega com o próprio <dialog> como alvo
        if (evento.target === dialogo.current) cancelar();
      }}
    >
      <div className="dialogo-confirmacao__conteudo">
        <h2 id={idTitulo}>{titulo}</h2>
        <p id={idDescricao}>
          <strong>{destaque}</strong>
          {descricao}
        </p>
        <div className="admin-acoes">
          <button className="admin-botao admin-botao--secundario" type="button" disabled={enviando} onClick={cancelar}>
            Cancelar
          </button>
          <button className="admin-botao admin-botao--primario" type="button" disabled={enviando} onClick={onConfirmar}>
            {enviando ? 'Enviando...' : rotuloConfirmar}
          </button>
        </div>
      </div>
    </dialog>
  );
}

export default DialogoConfirmacao;
