import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import CardIndicador from '../components/CardIndicador/CardIndicador'

describe('CardIndicador', () => {
  it('renderiza os dados do indicador', () => {
    render(
      <CardIndicador
        name="Número de leitos"
        value="350"
        unit="leitos"
        periodo="2025/2"
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

    expect(
      screen.getByText('2025/2'),
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
        periodo="2025/2"
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
        periodo="2025/2"
        variation={-5}
      />,
    )

    expect(screen.getByText('↓')).toBeInTheDocument()
    expect(screen.getByText('5%')).toBeInTheDocument()
  })

  it('renderiza o período do indicador', () => {
    render(
      <CardIndicador
        name="Número de leitos"
        value="350"
        unit="leitos"
        periodo="2025/2"
        variation={12}
      />,
    )

    expect(
      screen.getByText('2025/2'),
    ).toBeInTheDocument()
  })

  it('mostra que não existe período anterior quando a variação é null', () => {
    render(
      <CardIndicador
        name="Taxa de ocupação"
        value="68"
        unit="%"
        periodo="2025/2"
        variation={null}
      />,
    )

    expect(
      screen.getByText('Sem período anterior'),
    ).toBeInTheDocument()

    expect(
      screen.queryByText('0%'),
    ).not.toBeInTheDocument()

    expect(
      screen.queryByText('↑'),
    ).not.toBeInTheDocument()

    expect(
      screen.queryByText('↓'),
    ).not.toBeInTheDocument()
  })

  it('aceita o período no formato da API', () => {
    render(
      <CardIndicador name="Leitos" value={1280} unit="leitos"
        periodo={{ ano: 2025, semestre: 2 }} variation={12.2} />,
    )
    expect(screen.getByText('2025/2')).toBeInTheDocument()
    expect(screen.getByText('1.280')).toBeInTheDocument()
    expect(screen.getByText('12,2%')).toBeInTheDocument()
  })

    it.each([
    [420, 'R$', 'R$ 420'],
    [55, '%', '55%'],
  ])('mostra %s com a unidade %s junto do valor', (value, unit, esperado) => {
    render(
      <CardIndicador name="Indicador" value={value} unit={unit} periodo="2025/2" variation={null} />,
    )

    expect(screen.getByText(esperado)).toBeInTheDocument()
    expect(screen.queryByText(unit)).not.toBeInTheDocument()
  })

  it('mostra a unidade em palavra ao lado do valor', () => {
    render(
      <CardIndicador name="Tempo médio" value={1.5} unit="dias" periodo="2025/2" variation={null} />,
    )

    expect(screen.getByText('dias')).toBeInTheDocument()
    expect(screen.getByRole('article')).toHaveTextContent('1,5 dias')
  })
})