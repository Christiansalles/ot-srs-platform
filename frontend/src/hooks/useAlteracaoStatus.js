import { useLayoutEffect, useRef, useState } from 'react';

// Fluxo de publicar e despublicar do painel: guarda o item a confirmar, envia e mostra o resultado.
// `alterar` recebe o que foi passado a `abrir`, chama a API e devolve o texto de sucesso.
export function useAlteracaoStatus(alterar) {
  const [confirmacao, setConfirmacao] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState(null);
  const avisoRef = useRef(null);

  // Com filtro de status, a linha sai da lista e o botão que abriu o diálogo deixa de existir.
  // Layout effect: o foco muda no mesmo commit que mostra a mensagem, depois de o diálogo devolver o foco.
  useLayoutEffect(() => {
    if (aviso && document.activeElement === document.body) avisoRef.current?.focus();
  }, [aviso]);

  async function confirmar() {
    setAviso(null);
    setEnviando(true);
    try {
      setAviso({ tipo: 'sucesso', texto: await alterar(confirmacao) });
    } catch (falha) {
      setAviso({ tipo: 'erro', texto: falha.message || 'Não foi possível alterar o status. Tente novamente.' });
    } finally {
      setEnviando(false);
      setConfirmacao(null);
    }
  }

  return {
    confirmacao,
    enviando,
    aviso,
    avisoRef,
    abrir: setConfirmacao,
    cancelar: () => setConfirmacao(null),
    confirmar,
    limparAviso: () => setAviso(null),
  };
}
