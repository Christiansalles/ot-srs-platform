import { render, screen } from '@testing-library/react';
import LinkExterno from '../components/LinkExterno/LinkExterno';

describe('LinkExterno', () => {
  it('abre em aba nova, sem dar acesso à página de origem, e avisa o leitor de tela', () => {
    render(<LinkExterno href="https://cadastur.turismo.gov.br/">Site do Cadastur</LinkExterno>);
    const link = screen.getByRole('link', { name: 'Site do Cadastur (abre em nova aba)' });

    expect(link).toHaveAttribute('href', 'https://cadastur.turismo.gov.br/');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});
