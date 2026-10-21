import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import StatusBadge from '../components/StatusBadge/StatusBadge'

describe('StatusBadge', () => {
  it.each([
    ['rascunho', 'Rascunho'],
    ['publicado', 'Publicado'],
  ])('mostra o texto certo para %s', (status, texto) => {
    render(<StatusBadge status={status} />)

    const badge = screen.getByText(texto)
    expect(badge).toHaveTextContent(new RegExp(`^${texto}$`))
    expect(badge).toHaveClass(`status-badge--${status}`)
  })

  it('não depende só da cor: o ponto é decorativo e o texto fica visível', () => {
    const { container } = render(<StatusBadge status="rascunho" />)

    expect(container.querySelector('.status-badge__dot')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByText('Rascunho')).toBeVisible()
  })

  it('mostra o valor recebido com estilo neutro quando o status é desconhecido', () => {
    render(<StatusBadge status="arquivado" />)

    expect(screen.getByText('arquivado')).toHaveClass('status-badge--desconhecido')
  })
})
