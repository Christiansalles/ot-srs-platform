import { fireEvent, render, screen } from '@testing-library/react';
import App from '../App';

describe('App', () => {
  it('renderiza a home com os destaques do setor de hospedagem', async () => {
    render(<App />);

    expect(
      await screen.findByRole('heading', { name: /indicadores do turismo/i }),
    ).toBeInTheDocument();
    expect(await screen.findByText(/número de leitos/i)).toBeInTheDocument();
  });

  it('navega para a página de indicadores e mostra a tabela', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('link', { name: /indicadores/i }));

    expect(
      await screen.findByRole('heading', { name: /indicadores turísticos/i }),
    ).toBeInTheDocument();
    const linhas = await screen.findAllByText(/número de leitos/i);
    expect(linhas.length).toBeGreaterThan(0);
  });
});
