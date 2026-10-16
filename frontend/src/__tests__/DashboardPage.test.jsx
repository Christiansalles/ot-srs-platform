import { render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import DashboardPage from '../pages/Dashboard/DashboardPage'

function stubApi({ indicadores = [], destaques = [], ok = true } = {}) {
  vi.stubEnv('VITE_USE_MOCK', 'false')
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url) => {
      if (!ok) return Promise.resolve({ ok: false, status: 503 })

      const dados = url.endsWith('/destaques') ? destaques : indicadores
      return Promise.resolve({ ok: true, json: async () => dados })
    }),
  )
}

function destaque(id, nome, valor = 10) {
  return {
    id,
    nome,
    unidade: 'un',
    valor,
    periodo: { ano: 2025, semestre: 2 },
    variacao_percentual: null,
  }
}

function indicador(id, nome) {
  return {
    id,
    nome,
    unidade: 'un',
    setor: { id: 1, nome: 'Hospedagem' },
    medicoes: [{ ano: 2025, semestre: 2, valor: 10 }],
  }
}

// As regras de filtro e de ordem têm testes próprios em montarCards.test.js.
// Aqui ficam só a ligação da página com a API, com o card e com o gráfico.
describe('DashboardPage', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_USE_MOCK', 'true')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('mostra um card para cada destaque que vira card, na ordem de montarCards', async () => {
    stubApi({
      destaques: [
        destaque(4, 'Empregos no setor'),
        destaque(7, 'Taxa de ocupação'),
        destaque(1, 'Número de leitos'),
        destaque(8, 'Participação econômica'),
        destaque(3, 'Fluxo de visitantes'),
        destaque(5, 'Número de empresas'),
      ],
    })

    render(<DashboardPage />)

    await screen.findAllByRole('article')

    const nomes = screen
      .getAllByRole('article')
      .map((card) => within(card).getByRole('heading').textContent)

    expect(nomes).toEqual([
      'Número de leitos',
      'Fluxo de visitantes',
      'Número de empresas',
      'Empregos no setor',
      'Taxa de ocupação',
    ])
  })

  it('passa os dados do destaque para o card', async () => {
    render(<DashboardPage />)

    const card = (
      await screen.findByRole('heading', { name: 'Número de leitos' })
    ).closest('article')

    expect(within(card).getByText('350')).toBeInTheDocument()
    expect(within(card).getByText('leitos')).toBeInTheDocument()
    expect(within(card).getByText('2025/2')).toBeInTheDocument()
    expect(within(card).getByText('12,2%')).toBeInTheDocument()
  })

  it('usa no gráfico a série do indicador com o mesmo id do primeiro card', async () => {
    stubApi({
      destaques: [destaque(2, 'Taxa de ocupação'), destaque(1, 'Número de leitos')],
      indicadores: [
        indicador(2, 'Taxa de ocupação'),
        indicador(1, 'Número de leitos'),
      ],
    })

    render(<DashboardPage />)

    // "Número de leitos" é o primeiro card pela ordem do mockup.
    expect(
      await screen.findByText('Evolução do número de leitos'),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('Evolução do número de visitantes'),
    ).not.toBeInTheDocument()
  })

  it('mostra os cards mesmo sem a série do primeiro card', async () => {
    stubApi({ destaques: [destaque(1, 'Número de leitos')], indicadores: [] })

    render(<DashboardPage />)

    expect(await screen.findAllByRole('article')).toHaveLength(1)
    expect(
      screen.getByRole('region', {
        name: 'Série histórica do indicador',
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        'Não há dados disponíveis para exibir a série histórica.',
      ),
    ).toBeInTheDocument()
  })

  it('não cria card a partir de um indicador que não tem destaque', async () => {
    stubApi({
      indicadores: [indicador(1, 'Número de leitos')],
      destaques: [],
    })

    render(<DashboardPage />)

    expect(
      await screen.findByText('Sem indicadores disponíveis no momento.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('region', { name: 'Série histórica do indicador' }),
    ).not.toBeInTheDocument()
  })

  it('mostra o estado de carregando antes dos dados chegarem', async () => {
    render(<DashboardPage />)

    expect(screen.getByText('Carregando indicadores...')).toBeInTheDocument()

    await screen.findAllByRole('article')
  })

  it('mostra mensagem de erro quando a API falha', async () => {
    stubApi({ ok: false })

    render(<DashboardPage />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar o dashboard',
    )
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
  })

  it('mostra mensagem de sem dados quando a API devolve listas vazias', async () => {
    stubApi({ indicadores: [], destaques: [] })

    render(<DashboardPage />)

    expect(
      await screen.findByText('Sem indicadores disponíveis no momento.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
  })

  it('mostra a rosca de distribuição por setor com o ano e os setores do mock', async () => {
    render(<DashboardPage />)

    const rosca = await screen.findByRole('region', {
      name: 'Distribuição por setor',
    })

    expect(
      within(rosca).getByRole('heading', { name: 'Distribuição por setor (2025)' }),
    ).toBeInTheDocument()
    expect(within(rosca).getAllByRole('listitem')).toHaveLength(5)
    expect(within(rosca).getByText('Hospedagem')).toBeInTheDocument()
    expect(within(rosca).getByText('28%')).toBeInTheDocument()
    expect(
      within(rosca).getByText(/Metodologia: Mapeamento contínuo SMCELT/),
    ).toBeInTheDocument()
  })

  it('mostra a mensagem de sem dados na rosca quando não há participação econômica', async () => {
    stubApi({
      destaques: [destaque(1, 'Número de leitos')],
      indicadores: [indicador(1, 'Número de leitos')],
    })

    render(<DashboardPage />)

    const rosca = await screen.findByRole('region', {
      name: 'Distribuição por setor',
    })

    expect(
      within(rosca).getByText(
        'Não há dados disponíveis para exibir a distribuição por setor.',
      ),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(1)
  })

  it('mostra o gráfico comparativo anual', async () => {
    render(<DashboardPage />)

    const comparativo = await screen.findByRole('region', {
      name: 'Comparativo anual',
    })

    expect(comparativo).toBeInTheDocument()

    expect(
      within(comparativo).getByRole('heading', {
        name: 'Comparativo anual',
      }),
    ).toBeInTheDocument()

    expect(
      within(comparativo).getByText('Variação das 4 dimensões-chave'),
    ).toBeInTheDocument()
  })

})
