import { fireEvent, render, screen } from '@testing-library/react'
import { cloneElement } from 'react'
import { describe, expect, it, vi } from 'vitest'

import GraficoSerieHistorica from '../components/GraficoSerieHistorica/GraficoSerieHistorica'
import { INDICADORES } from '../config/indicadores'

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

const indicadores = [
  {
    nome: INDICADORES.LEITOS,
    unidade: 'leitos',
    medicoes: [
      { ano: 2023, semestre: 2, valor: 280 },
      { ano: 2024, semestre: 2, valor: 312 },
      { ano: 2025, semestre: 2, valor: 350 },
    ],
  },
  {
    nome: INDICADORES.VISITANTES,
    unidade: 'visitantes',
    medicoes: [
      { ano: 2020, semestre: 2, valor: 1100 },
      { ano: 2021, semestre: 2, valor: 1900 },
      { ano: 2022, semestre: 2, valor: 2450 },
      { ano: 2023, semestre: 2, valor: 3600 },
      { ano: 2024, semestre: 2, valor: 4400 },
      { ano: 2025, semestre: 2, valor: 5200 },
    ],
  },
  {
    nome: INDICADORES.EMPRESAS,
    unidade: 'empresas',
    medicoes: [
      { ano: 2024, semestre: 2, valor: 104 },
      { ano: 2025, semestre: 2, valor: 120 },
    ],
  },
  {
    nome: INDICADORES.EMPREGOS,
    unidade: 'empregos',
    medicoes: [
      { ano: 2024, semestre: 2, valor: 760 },
      { ano: 2025, semestre: 2, valor: 840 },
    ],
  },
]

describe('GraficoSerieHistorica', () => {
  it('renderiza o gráfico com visitantes selecionado por padrão', () => {
    render(
      <GraficoSerieHistorica
        indicadores={indicadores}
      />,
    )

    expect(
      screen.getByRole('region', {
        name: 'Série histórica do indicador',
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByText('Evolução do número de visitantes'),
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        'Série histórica observada no município',
      ),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('combobox', {
        name: 'Indicador da série histórica',
      }),
    ).toHaveValue(INDICADORES.VISITANTES)
  })

  it('mostra os períodos das medições do indicador selecionado', () => {
    render(
      <GraficoSerieHistorica
        indicadores={indicadores}
      />,
    )

    expect(screen.getByText('2020/2')).toBeInTheDocument()
    expect(screen.getByText('2021/2')).toBeInTheDocument()
    expect(screen.getByText('2022/2')).toBeInTheDocument()
    expect(screen.getByText('2023/2')).toBeInTheDocument()
    expect(screen.getByText('2024/2')).toBeInTheDocument()
    expect(screen.getByText('2025/2')).toBeInTheDocument()
  })

  it('desenha a linha e o preenchimento abaixo dela', () => {
    const { container } = render(
      <GraficoSerieHistorica
        indicadores={indicadores}
      />,
    )

    expect(
      container.querySelector('.recharts-line-curve'),
    ).toBeInTheDocument()

    expect(
      container.querySelector('.recharts-area-area'),
    ).toBeInTheDocument()
  })

  it('permite trocar o indicador pelo seletor', () => {
    render(
      <GraficoSerieHistorica
        indicadores={indicadores}
      />,
    )

    const seletor = screen.getByRole('combobox', {
      name: 'Indicador da série histórica',
    })

    fireEvent.change(seletor, {
      target: {
        value: INDICADORES.LEITOS,
      },
    })

    expect(seletor).toHaveValue(INDICADORES.LEITOS)

    expect(
      screen.getByText('Evolução do número de leitos'),
    ).toBeInTheDocument()
  })

  it('atualiza os dados ao trocar o indicador', () => {
    render(
      <GraficoSerieHistorica
        indicadores={indicadores}
      />,
    )

    const seletor = screen.getByRole('combobox', {
      name: 'Indicador da série histórica',
    })

    fireEvent.change(seletor, {
      target: {
        value: INDICADORES.LEITOS,
      },
    })

    expect(screen.getByText('2023/2')).toBeInTheDocument()
    expect(screen.getByText('2024/2')).toBeInTheDocument()
    expect(screen.getByText('2025/2')).toBeInTheDocument()

    expect(
      screen.queryByText('2020/2'),
    ).not.toBeInTheDocument()
  })

  it('exibe apenas indicadores que possuem histórico', () => {
    const indicadoresSemHistorico = [
      {
        nome: INDICADORES.LEITOS,
        unidade: 'leitos',
        medicoes: [
          { ano: 2024, semestre: 2, valor: 312 },
        ],
      },
      {
        nome: INDICADORES.VISITANTES,
        unidade: 'visitantes',
        medicoes: [
          { ano: 2024, semestre: 2, valor: 4400 },
        ],
      },
      {
        nome: INDICADORES.EMPRESAS,
        unidade: 'empresas',
        medicoes: [],
      },
      {
        nome: INDICADORES.EMPREGOS,
        unidade: 'empregos',
        medicoes: [
          { ano: 2024, semestre: 2, valor: 760 },
        ],
      },
    ]

    render(
      <GraficoSerieHistorica
        indicadores={indicadoresSemHistorico}
      />,
    )

    expect(
      screen.getByRole('option', {
        name: 'Leitos',
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('option', {
        name: 'Visitantes',
      }),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('option', {
        name: 'Empresas',
      }),
    ).not.toBeInTheDocument()

    expect(
      screen.getByRole('option', {
        name: 'Empregos',
      }),
    ).toBeInTheDocument()
  })

  it('mostra mensagem de sem dados quando nenhum indicador possui histórico', () => {
    const indicadoresSemHistorico = indicadores.map(
      (indicador) => ({
        ...indicador,
        medicoes: [],
      }),
    )

    render(
      <GraficoSerieHistorica
        indicadores={indicadoresSemHistorico}
      />,
    )

    expect(
      screen.getByText(
        'Não há dados disponíveis para exibir a série histórica.',
      ),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('combobox', {
        name: 'Indicador da série histórica',
      }),
    ).not.toBeInTheDocument()
  })

  it('mostra mensagem de sem dados quando indicadores não é informado', () => {
    render(
      <GraficoSerieHistorica />,
    )

    expect(
      screen.getByText(
        'Não há dados disponíveis para exibir a série histórica.',
      ),
    ).toBeInTheDocument()
  })

  it('usa ids de gradiente diferentes para cada gráfico da página', () => {
    const { container } = render(
      <>
        <GraficoSerieHistorica
          indicadores={indicadores}
        />
        <GraficoSerieHistorica
          indicadores={indicadores}
        />
      </>,
    )

    const ids = [
      ...container.querySelectorAll('linearGradient'),
    ].map(
      (gradiente) => gradiente.id,
    )

    expect(ids).toHaveLength(4)
    expect(new Set(ids).size).toBe(4)
  })

  it('mantém a linha visível quando todos os valores são iguais', () => {
    const indicadoresComValoresIguais = [
      {
        nome: INDICADORES.VISITANTES,
        unidade: 'visitantes',
        medicoes: [
          { ano: 2024, semestre: 2, valor: 120 },
          { ano: 2025, semestre: 2, valor: 120 },
        ],
      },
    ]

    const { container } = render(
      <GraficoSerieHistorica
        indicadores={indicadoresComValoresIguais}
      />,
    )

    const linha = container.querySelector('.recharts-line-curve')

    const stroke = linha.getAttribute('stroke')
    const idGradiente = stroke.match(/url\(#(.+)\)/)?.[1]

    expect(idGradiente).toBeTruthy()

    expect(
      container.querySelector(`[id="${idGradiente}"]`),
    ).toHaveAttribute('gradientUnits', 'userSpaceOnUse')
  })
})
