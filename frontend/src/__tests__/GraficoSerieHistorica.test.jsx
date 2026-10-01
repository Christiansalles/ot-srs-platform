import { render, screen } from '@testing-library/react'
import { cloneElement } from 'react'
import { describe, expect, it, vi } from 'vitest'

import GraficoSerieHistorica from '../components/GraficoSerieHistorica/GraficoSerieHistorica'

// No ambiente de testes o ResponsiveContainer não tem largura e o gráfico
// não é desenhado. Aqui ele é trocado por um container de tamanho fixo.
vi.mock('recharts', async (importOriginal) => {
  const original = await importOriginal()

  return {
    ...original,
    ResponsiveContainer: ({ children }) =>
      cloneElement(children, { width: 800, height: 280 }),
  }
})

const medicoes = [
  { ano: 2023, semestre: 2, valor: 280 },
  { ano: 2024, semestre: 2, valor: 312 },
  { ano: 2025, semestre: 2, valor: 350 },
]

describe('GraficoSerieHistorica', () => {
  it('renderiza o gráfico com dados das medições', () => {
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
      screen.getByText('Série histórica anual observada no município'),
    ).toBeInTheDocument()
  })

  it('mostra os períodos das medições no eixo X', () => {
    render(<GraficoSerieHistorica medicoes={medicoes} />)

    expect(screen.getByText('2023/2')).toBeInTheDocument()
    expect(screen.getByText('2024/2')).toBeInTheDocument()
    expect(screen.getByText('2025/2')).toBeInTheDocument()
  })

  it('desenha a linha e o preenchimento abaixo dela', () => {
    const { container } = render(
      <GraficoSerieHistorica medicoes={medicoes} />,
    )

    expect(
      container.querySelector('.recharts-line-curve'),
    ).toBeInTheDocument()

    expect(
      container.querySelector('.recharts-area-area'),
    ).toBeInTheDocument()
  })

  it('mostra mensagem de sem dados quando a lista está vazia', () => {
    render(<GraficoSerieHistorica medicoes={[]} />)

    expect(
      screen.getByText(
        'Não há dados disponíveis para exibir a série histórica.',
      ),
    ).toBeInTheDocument()
  })

  it('mostra mensagem de sem dados quando medicoes não é informado', () => {
    render(<GraficoSerieHistorica />)

    expect(
      screen.getByText(
        'Não há dados disponíveis para exibir a série histórica.',
      ),
    ).toBeInTheDocument()
  })

  it('usa ids de gradiente diferentes para cada gráfico da página', () => {
    const { container } = render(
      <>
        <GraficoSerieHistorica medicoes={medicoes} />
        <GraficoSerieHistorica medicoes={medicoes} />
      </>,
    )

    const ids = [...container.querySelectorAll('linearGradient')].map(
      (gradiente) => gradiente.id,
    )

    expect(ids).toHaveLength(4)
    expect(new Set(ids).size).toBe(4)
  })

  it('mantém a linha visível quando todos os valores são iguais', () => {
    const { container } = render(
      <GraficoSerieHistorica
        medicoes={[
          { ano: 2024, semestre: 2, valor: 120 },
          { ano: 2025, semestre: 2, valor: 120 },
        ]}
      />,
    )

    // Com o padrão objectBoundingBox, uma linha reta (altura zero) não é desenhada.
    const linha = container.querySelector('.recharts-line-curve')
    const idGradiente = linha.getAttribute('stroke').match(/url\(#(.+)\)/)[1]

    expect(
      container.querySelector(`[id="${idGradiente}"]`),
    ).toHaveAttribute('gradientUnits', 'userSpaceOnUse')
  })
})
