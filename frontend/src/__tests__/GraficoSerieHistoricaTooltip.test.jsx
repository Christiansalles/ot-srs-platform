import { render, screen } from '@testing-library/react'
import { cloneElement } from 'react'
import { describe, expect, it, vi } from 'vitest'

import GraficoSerieHistorica from '../components/GraficoSerieHistorica/GraficoSerieHistorica'

// O tooltip real só abre com o mouse sobre o gráfico, o que o ambiente de
// testes não simula. Aqui o Tooltip é trocado por um que mostra o que o
// formatter recebido devolve para o valor 350.
vi.mock('recharts', async (importOriginal) => {
  const original = await importOriginal()

  return {
    ...original,
    ResponsiveContainer: ({ children }) =>
      cloneElement(children, { width: 800, height: 280 }),
    Tooltip: ({ formatter }) => <output>{formatter(350, 'Valor')}</output>,
  }
})

const medicoes = [
  { ano: 2024, semestre: 2, valor: 312 },
  { ano: 2025, semestre: 2, valor: 350 },
]

describe('GraficoSerieHistorica: tooltip', () => {
  it.each([
    ['R$', 'R$ 350'],
    ['%', '350%'],
    ['leitos', '350 leitos'],
  ])('formata o valor com a unidade %s', (unidade, esperado) => {
    render(<GraficoSerieHistorica medicoes={medicoes} unidade={unidade} />)

    expect(screen.getByRole('status')).toHaveTextContent(esperado)
  })

  it('mostra só o valor quando não há unidade', () => {
    render(<GraficoSerieHistorica medicoes={medicoes} />)

    expect(screen.getByRole('status')).toHaveTextContent('350')
    expect(screen.getByRole('status')).not.toHaveTextContent('R$')
  })
})