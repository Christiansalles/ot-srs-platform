import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import App from '../App';
import PularParaConteudo from '../components/PularParaConteudo/PularParaConteudo';

const FOCAVEIS = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

describe('PularParaConteudo', () => {
  it('leva o foco ao conteúdo sem mudar a URL', () => {
    window.history.replaceState({}, '', '/indicadores?ano=2025');
    render(
      <>
        <PularParaConteudo alvo="conteudo" />
        <main id="conteudo" tabIndex={-1}>Conteúdo</main>
      </>,
    );

    fireEvent.click(screen.getByRole('link', { name: 'Pular para o conteúdo' }));

    expect(screen.getByRole('main')).toHaveFocus();
    expect(window.location.pathname + window.location.search + window.location.hash).toBe('/indicadores?ano=2025');
    window.history.replaceState({}, '', '/');
  });

  it('deixa o navegador seguir a âncora quando o alvo não existe', () => {
    render(<PularParaConteudo alvo="nao-existe" />);
    const link = screen.getByRole('link', { name: 'Pular para o conteúdo' });

    expect(link).toHaveAttribute('href', '#nao-existe');
    expect(fireEvent.click(link)).toBe(true);
  });
});

describe('Pular para o conteúdo no portal', () => {
  beforeEach(() => vi.stubEnv('VITE_USE_MOCK', 'true'));
  afterEach(() => {
    vi.unstubAllEnvs();
    window.history.replaceState({}, '', '/');
  });

  it.each(['/', '/indicadores', '/dashboard', '/relatorios', '/endereco-invalido'])(
    'é a primeira parada do Tab em %s e leva ao main',
    async (caminho) => {
      window.history.replaceState({}, '', caminho);
      const { container } = render(<App />);

      const primeiro = container.querySelector(FOCAVEIS);
      expect(primeiro).toHaveAccessibleName('Pular para o conteúdo');

      fireEvent.click(primeiro);
      expect(screen.getByRole('main')).toHaveFocus();
    },
  );
});
