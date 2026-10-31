import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import AdminCabecalho from '../components/AdminCabecalho/AdminCabecalho';

describe('AdminCabecalho', () => {
  it('mostra sobretítulo, título com id, descrição e a ação passada como filho', () => {
    render(
      <AdminCabecalho id="titulo-teste" sobretitulo="Gestão de dados" titulo="Indicadores" descricao="Descrição da página">
        <a href="/admin">Voltar ao painel</a>
      </AdminCabecalho>,
    );

    expect(screen.getByText('Gestão de dados')).toHaveClass('admin-cabecalho__sobretitulo');
    expect(screen.getByRole('heading', { level: 1, name: 'Indicadores' })).toHaveAttribute('id', 'titulo-teste');
    expect(screen.getByText('Descrição da página')).toHaveClass('admin-cabecalho__descricao');
    expect(screen.getByRole('link', { name: 'Voltar ao painel' })).toBeInTheDocument();
  });

  it('não cria parágrafo vazio quando não há descrição', () => {
    const { container } = render(<AdminCabecalho id="t" sobretitulo="Gestão" titulo="Relatórios" />);

    expect(container.querySelector('.admin-cabecalho__descricao')).toBeNull();
  });
});
