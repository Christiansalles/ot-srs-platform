import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import CardIndicador from '../components/CardIndicador/CardIndicador.jsx'

describe('CardIndicador', () => {
  it('renderiza os dados do indicador', () => {
    render(
      <CardIndicador
        name="Número de leitos"
        value="350"
        unit="leitos"
        variation={12}
      />,
    )

    expect(
      screen.getByRole('heading', {
        name: 'Número de leitos',
      }),
    ).toBeInTheDocument()

    expect(screen.getByText('350')).toBeInTheDocument()

    expect(
      screen.getByText('leitos'),
    ).toBeInTheDocument()

    expect(screen.getByText('12%')).toBeInTheDocument()

    expect(
      screen.getByText('vs. período anterior'),
    ).toBeInTheDocument()
  })

  it('mostra seta para cima quando a variação é positiva', () => {
    render(
      <CardIndicador
        name="Número de leitos"
        value="350"
        unit="leitos"
        variation={12}
      />,
    )

    expect(screen.getByText('↑')).toBeInTheDocument()
  })

  it('mostra seta para baixo quando a variação é negativa', () => {
    render(
      <CardIndicador
        name="Número de leitos"
        value="330"
        unit="leitos"
        variation={-5}
      />,
    )

    expect(screen.getByText('↓')).toBeInTheDocument()
    expect(screen.getByText('5%')).toBeInTheDocument()
  })
})