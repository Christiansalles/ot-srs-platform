import { render, screen } from '@testing-library/react'
import { cloneElement } from 'react'
import { describe, expect, it, vi } from 'vitest'

import GraficoComparativoAnual from '../components/GraficoComparativoAnual/GraficoComparativoAnual'
import { mockIndicadores } from '../mocks/dados'
import { montarComparativoAnual } from '../utils/montarComparativoAnual'
import { INDICADORES } from '../config/indicadores'

vi.mock('recharts', async (importOriginal) => {
  const original = await importOriginal()

  return {
    ...original,

    // O ResponsiveContainer depende das dimensões do navegador,
    // que não existem no ambiente de testes.
    ResponsiveContainer: ({ children }) =>
      cloneElement(children, {
        width: 800,
        height: 280,
      }),
  }
})

const dadosDoMock = montarComparativoAnual(mockIndicadores)

function renderizar(props = {}) {
  return render(
    <GraficoComparativoAnual
      dados={dadosDoMock}
      {...props}
    />,
  )
}

function barras(container) {
  return [
    ...container.querySelectorAll(
      '.recharts-bar-rectangle',
    ),
  ]
}

describe('GraficoComparativoAnual', () => {
  it('mostra o título do gráfico', () => {
    renderizar()

    expect(
      screen.getByRole('heading', {
        name: 'Comparativo anual',
      }),
    ).toBeInTheDocument()
  })

  it('mostra o subtítulo do gráfico', () => {
    renderizar()

    expect(
      screen.getByText('Variação das 4 dimensões-chave'),
    ).toBeInTheDocument()
  })

  it('mostra os dois anos na legenda', () => {
    renderizar()

    expect(screen.getByText('2024')).toBeInTheDocument()
    expect(screen.getByText('2025')).toBeInTheDocument()
  })

  it('mostra os quatro indicadores do comparativo', () => {
    renderizar()

    expect(screen.getByText('Leitos')).toBeInTheDocument()
    expect(screen.getByText('Visitantes')).toBeInTheDocument()
    expect(screen.getByText('Empresas')).toBeInTheDocument()
    expect(screen.getByText('Empregos')).toBeInTheDocument()
  })

  it('desenha duas barras para cada indicador', () => {
    const { container } = renderizar()

    expect(barras(container)).toHaveLength(8)
  })

  it('mostra mensagem de sem dados quando a lista está vazia', () => {
    const { container } = renderizar({
      dados: [],
    })

    expect(
      screen.getByText(
        'Não há dados suficientes para comparar os anos.',
      ),
    ).toBeInTheDocument()

    expect(barras(container)).toHaveLength(0)
  })

  it('não mostra mensagem de sem dados quando existem dados', () => {
    renderizar()

    expect(
      screen.queryByText(
        'Não há dados suficientes para comparar os anos.',
      ),
    ).not.toBeInTheDocument()
  })

  it('expõe o gráfico como uma região acessível', () => {
    renderizar()

    expect(
      screen.getByRole('region', {
        name: 'Comparativo anual',
      }),
    ).toBeInTheDocument()
  })

  it('usa os dados informados mesmo quando são diferentes do mock', () => {
    const dados = [
      {
        nome: INDICADORES.LEITOS,
        unidade: 'leitos',
        anoAnterior: 2024,
        anoAtual: 2025,
        valorAnterior: 312,
        valorAtual: 350,
        anterior: 100,
        atual: 112.18,
      },
    ]

    renderizar({ dados })

    expect(screen.getByText('Leitos')).toBeInTheDocument()

    expect(screen.getByText('2024')).toBeInTheDocument()
    expect(screen.getByText('2025')).toBeInTheDocument()

    expect(screen.queryByText('Visitantes')).not.toBeInTheDocument()
  })
})
