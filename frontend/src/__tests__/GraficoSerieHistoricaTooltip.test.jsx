import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { TooltipSerieHistorica } from '../components/GraficoSerieHistorica/GraficoSerieHistorica'

describe('TooltipSerieHistorica', () => {
  it('não renderiza quando o tooltip não está ativo', () => {
    const { container } = render(
      <TooltipSerieHistorica
        active={false}
        payload={[]}
      />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('não renderiza quando não existem dados', () => {
    const { container } = render(
      <TooltipSerieHistorica
        active
        payload={[]}
      />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('mostra o período da medição', () => {
    render(
      <TooltipSerieHistorica
        active
        payload={[
          {
            payload: {
              periodo: '2025/2',
              valor: 350,
              unidade: 'leitos',
            },
          },
        ]}
      />,
    )

    expect(
      screen.getByText('2025/2'),
    ).toBeInTheDocument()
  })

  it('mostra o valor formatado com a unidade', () => {
    render(
      <TooltipSerieHistorica
        active
        payload={[
          {
            payload: {
              periodo: '2025/2',
              valor: 350,
              unidade: 'leitos',
            },
          },
        ]}
      />,
    )

    expect(
      screen.getByText('350 leitos'),
    ).toBeInTheDocument()
  })

  it.each([
    ['R$', 'R$ 350'],
    ['%', '350%'],
    ['leitos', '350 leitos'],
  ])(
    'formata o valor corretamente para a unidade %s',
    (unidade, esperado) => {
      render(
        <TooltipSerieHistorica
          active
          payload={[
            {
              payload: {
                periodo: '2025/2',
                valor: 350,
                unidade,
              },
            },
          ]}
        />,
      )

      expect(
        screen.getByText(esperado),
      ).toBeInTheDocument()
    },
  )

  it('mostra somente o valor quando não há unidade', () => {
    render(
      <TooltipSerieHistorica
        active
        payload={[
          {
            payload: {
              periodo: '2025/2',
              valor: 350,
            },
          },
        ]}
      />,
    )

    expect(
      screen.getByText('350'),
    ).toBeInTheDocument()

    expect(
      screen.queryByText(/R\$/),
    ).not.toBeInTheDocument()
  })

  it('mostra o rótulo Valor', () => {
    render(
      <TooltipSerieHistorica
        active
        payload={[
          {
            payload: {
              periodo: '2025/2',
              valor: 350,
              unidade: 'leitos',
            },
          },
        ]}
      />,
    )

    expect(
      screen.getByText('Valor'),
    ).toBeInTheDocument()
  })
})
