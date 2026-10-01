import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import GraficoSerieHistorica from '../components/GraficoSerieHistorica/GraficoSerieHistorica'

describe('GraficoSerieHistorica', () => {
  it('renderiza o gráfico com dados das medições', () => {
    const medicoes = [
      {
        ano: 2023,
        semestre: 2,
        valor: 280,
      },
      {
        ano: 2024,
        semestre: 2,
        valor: 312,
      },
      {
        ano: 2025,
        semestre: 2,
        valor: 350,
      },
    ]

    render(
      <GraficoSerieHistorica
        titulo="Evolução do número de leitos"
        subtitulo="Série histórica anual observada no município"
        medicoes={medicoes}
      />,
    )

    expect(
      screen.getByRole('region', {
        name: 'Série histórica do indicador',
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByText('Evolução do número de leitos'),
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        'Série histórica anual observada no município',
      ),
    ).toBeInTheDocument()
  })

  it('renderiza o gráfico com a lista de medições da série histórica', () => {
    const medicoes = [
      {
        ano: 2023,
        semestre: 2,
        valor: 280,
      },
      {
        ano: 2024,
        semestre: 2,
        valor: 312,
      },
      {
        ano: 2025,
        semestre: 2,
        valor: 350,
      },
    ]

    render(
      <GraficoSerieHistorica
        medicoes={medicoes}
      />,
    )

    expect(
      screen.getByRole('region', {
        name: 'Série histórica do indicador',
      }),
    ).toBeInTheDocument()
  })

  it('mostra mensagem de sem dados quando a lista está vazia', () => {
    render(
      <GraficoSerieHistorica
        medicoes={[]}
      />,
    )

    expect(
      screen.getByText(
        'Não há dados disponíveis para exibir a série histórica.',
      ),
    ).toBeInTheDocument()
  })

  it('mostra mensagem de sem dados quando medicoes não é informado', () => {
    render(
      <GraficoSerieHistorica />,
    )

    expect(
      screen.getByText(
        'Não há dados disponíveis para exibir a série histórica.',
      ),
    ).toBeInTheDocument()
  })
})