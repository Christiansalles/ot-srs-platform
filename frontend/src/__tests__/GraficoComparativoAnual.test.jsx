import { render, screen, within } from '@testing-library/react'
import { cloneElement } from 'react'
import { describe, expect, it, vi } from 'vitest'

import GraficoComparativoAnual from '../components/GraficoComparativoAnual/GraficoComparativoAnual'
import { mockIndicadores } from '../mocks/dados'
import { montarComparativoAnual } from '../utils/montarComparativoAnual'
import { formatarValor } from '../utils/formatarValor'
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

// O texto do gráfico se repete na tabela de dados para o leitor de tela; aqui interessa o desenho.
const FORA_DA_TABELA = { ignore: 'script, style, table *' }

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

    expect(screen.getByText('2024', FORA_DA_TABELA)).toBeInTheDocument()
    expect(screen.getByText('2025', FORA_DA_TABELA)).toBeInTheDocument()
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

    expect(screen.getByText('2024', FORA_DA_TABELA)).toBeInTheDocument()
    expect(screen.getByText('2025', FORA_DA_TABELA)).toBeInTheDocument()

    expect(screen.queryByText('Visitantes')).not.toBeInTheDocument()
  })

  it('dá nome ao gráfico e repete os valores numa tabela para o leitor de tela', () => {
    renderizar()

    expect(
      screen.getByRole('application', { name: 'Gráfico: comparativo anual' }),
    ).toBeInTheDocument()

    const tabela = screen.getByRole('table', { name: 'Dados do comparativo anual' })
    const { anoAnterior, anoAtual } = dadosDoMock[0]
    expect(
      within(tabela).getAllByRole('columnheader').map((celula) => celula.textContent),
    ).toEqual(['Indicador', String(anoAnterior), String(anoAtual)])

    for (const item of dadosDoMock) {
      const linha = within(tabela).getByRole('row', { name: new RegExp(`^${item.nome}`) })
      expect(within(linha).getAllByRole('cell').map((celula) => celula.textContent)).toEqual([
        formatarValor(item.valorAnterior, item.unidade),
        formatarValor(item.valorAtual, item.unidade),
      ])
    }
    expect(within(tabela).getAllByRole('row')).toHaveLength(dadosDoMock.length + 1)
  })

  it('não monta a tabela de dados quando não há o que comparar', () => {
    renderizar({ dados: [] })

    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})
