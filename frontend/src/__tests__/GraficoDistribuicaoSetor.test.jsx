import { render, screen, within } from '@testing-library/react'
import { cloneElement } from 'react'
import { describe, expect, it, vi } from 'vitest'

import GraficoDistribuicaoSetor from '../components/GraficoDistribuicaoSetor/GraficoDistribuicaoSetor'
import { mockIndicadores } from '../mocks/dados'
import { colors } from '../theme'
import { montarDistribuicao } from '../utils/montarDistribuicao'

let propsDaPie

// No ambiente de testes o ResponsiveContainer não tem largura e a rosca
// não é desenhada. Aqui ele é trocado por um container de tamanho fixo.
vi.mock('recharts', async (importOriginal) => {
  const original = await importOriginal()

  return {
    ...original,
    ResponsiveContainer: ({ children }) =>
      cloneElement(children, { width: 200, height: 200 }),
    // Só guarda as props recebidas, para conferir a animação.
    Pie: (props) => {
      propsDaPie = props

      return <original.Pie {...props} />
    },
  }
})

const dadosDoMock = montarDistribuicao(mockIndicadores)

// A animação fica desligada nos testes: com ela, só o primeiro quadro é
// desenhado e as fatias ainda não existem.
function renderizar(props) {
  return render(<GraficoDistribuicaoSetor animar={false} {...props} />)
}

function fatias(container) {
  return [...container.querySelectorAll('.recharts-pie-sector path')]
}

describe('GraficoDistribuicaoSetor', () => {
  it('mostra os 5 setores com as porcentagens do mock', () => {
    renderizar({ dados: dadosDoMock })

    const itens = screen.getAllByRole('listitem')

    expect(itens.map((item) => item.textContent)).toEqual([
      'Hospedagem28%',
      'Alimentação & Bares24%',
      'Serviços & Eventos20%',
      'Comércio Turístico18%',
      'Outros10%',
    ])
  })

  it('desenha uma fatia para cada setor', () => {
    const { container } = renderizar({ dados: dadosDoMock })

    expect(fatias(container)).toHaveLength(5)
  })

 it('usa as 5 primeiras cores do tema, na ordem, nas fatias e na legenda', () => {
    const { container } = renderizar({ dados: dadosDoMock })
    const esperadas = [
      colors.chart.cyan,
      colors.chart.violet,
      colors.chart.sky,
      colors.chart.lilac,
      colors.chart.softLilac,
    ]

    expect(fatias(container).map((fatia) => fatia.getAttribute('fill'))).toEqual(
      esperadas,
    )

    container
      .querySelectorAll('.grafico-distribuicao__cor')
      .forEach((cor, indice) => {
        expect(cor).toHaveStyle({ backgroundColor: esperadas[indice] })
      })
  })

  it('reaproveita as cores quando há mais de 5 setores', () => {
    const seis = [...dadosDoMock, { nome: 'Extra', valor: 5 }]
    const { container } = renderizar({ dados: seis })

    expect(fatias(container)[5].getAttribute('fill')).toBe(colors.chart.cyan)
  })

  it('mostra o ano no título quando ele é informado', () => {
    renderizar({ dados: dadosDoMock, ano: 2025 })

    expect(
      screen.getByRole('heading', { name: 'Distribuição por setor (2025)' }),
    ).toBeInTheDocument()
  })

  it('mostra o título sem ano quando ele não é informado', () => {
    renderizar({ dados: dadosDoMock })

    expect(
      screen.getByRole('heading', { name: 'Distribuição por setor' }),
    ).toBeInTheDocument()
  })

  it('aceita título e subtítulo próprios', () => {
    renderizar({
      dados: dadosDoMock,
      titulo: 'Participação por setor',
      subtitulo: 'Período mais recente',
    })

    const regiao = screen.getByRole('region', { name: 'Distribuição por setor' })

    expect(within(regiao).getByText('Participação por setor')).toBeInTheDocument()
    expect(within(regiao).getByText('Período mais recente')).toBeInTheDocument()
  })

  it('mostra o subtítulo do mockup por padrão', () => {
    renderizar({ dados: dadosDoMock })

    expect(
      screen.getByText('Participação econômica dos setores monitorados'),
    ).toBeInTheDocument()
  })

  it('mostra no centro a soma das participações', () => {
    renderizar({ dados: dadosDoMock })

    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.getByText('PARTICIPAÇÃO')).toBeInTheDocument()
  })

  it('soma os valores no centro, mesmo quando não chegam a 100%', () => {
    renderizar({
      dados: [
        { nome: 'A', valor: 30 },
        { nome: 'B', valor: 20 },
      ],
    })

    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.queryByText('100%')).not.toBeInTheDocument()
  })

  it('anima a rosca por padrão e permite desligar a animação', () => {
    render(<GraficoDistribuicaoSetor dados={dadosDoMock} />)
    expect(propsDaPie.isAnimationActive).toBe(true)

    renderizar({ dados: dadosDoMock })
    expect(propsDaPie.isAnimationActive).toBe(false)
  })

  it('mostra a nota só quando ela é informada', () => {
    const { rerender } = renderizar({ dados: dadosDoMock })

    expect(screen.queryByText('Metodologia: exemplo')).not.toBeInTheDocument()

    rerender(
      <GraficoDistribuicaoSetor
        animar={false}
        dados={dadosDoMock}
        nota="Metodologia: exemplo"
      />,
    )

    expect(screen.getByText('Metodologia: exemplo')).toBeInTheDocument()
  })

  it('mostra mensagem de sem dados quando a lista está vazia', () => {
    const { container } = renderizar({ dados: [], nota: 'Metodologia: exemplo' })

    expect(
      screen.getByText('Não há dados disponíveis para exibir a distribuição por setor.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
    expect(screen.queryByText('Metodologia: exemplo')).not.toBeInTheDocument()
    expect(fatias(container)).toHaveLength(0)
  })

  it('mostra mensagem de sem dados quando dados não é informado', () => {
    renderizar({})

    expect(
      screen.getByText('Não há dados disponíveis para exibir a distribuição por setor.'),
    ).toBeInTheDocument()
  })
})
