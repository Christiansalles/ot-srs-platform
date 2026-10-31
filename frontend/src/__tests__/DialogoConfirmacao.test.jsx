import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DialogoConfirmacao from '../components/DialogoConfirmacao/DialogoConfirmacao';

function renderDialogo(props) {
  const onCancelar = vi.fn();
  render(
    <DialogoConfirmacao
      titulo="Publicar medição?"
      destaque="Número de leitos - 2025/2"
      descricao="Após a publicação, a medição ficará visível no portal público."
      rotuloConfirmar="Publicar"
      onConfirmar={vi.fn()}
      onCancelar={onCancelar}
      {...props}
    />,
  );
  return { dialogo: screen.getByRole('dialog'), onCancelar };
}

// O Chrome deixa uma segunda tecla Esc fechar o <dialog> mesmo com preventDefault no cancel
function fecharPeloNavegador(dialogo) {
  dialogo.open = false;
  fireEvent(dialogo, new Event('close'));
}

describe('DialogoConfirmacao', () => {
  afterEach(() => vi.restoreAllMocks());

  it('avisa a página quando o navegador fecha o diálogo fora do envio', () => {
    const { dialogo, onCancelar } = renderDialogo();

    fecharPeloNavegador(dialogo);

    expect(onCancelar).toHaveBeenCalledOnce();
  });

  it('ignora o evento de fechamento que chega com o diálogo já reaberto', () => {
    const { dialogo, onCancelar } = renderDialogo();

    fireEvent(dialogo, new Event('close'));

    expect(onCancelar).not.toHaveBeenCalled();
  });

  it('reabre o diálogo se o navegador fechar durante o envio', () => {
    const { dialogo, onCancelar } = renderDialogo({ enviando: true });

    fecharPeloNavegador(dialogo);

    expect(dialogo).toHaveAttribute('open');
    expect(onCancelar).not.toHaveBeenCalled();
  });
});
