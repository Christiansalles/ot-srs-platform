import { render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import Dashboard from '../pages/Dashboard/DashboardPage'

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

describe('Dashboard', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_USE_MOCK', 'true')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('mostra o card de leitos do período mais recente e o gráfico do mock', async () => {
    render(<Dashboard />)

    const card = (
      await screen.findByRole('heading', { name: 'Número de leitos' })
    ).closest('article')

    expect(within(card).getByText('350')).toBeInTheDocument()
    expect(within(card).getByText('leitos')).toBeInTheDocument()
    expect(within(card).getByText('2025/2')).toBeInTheDocument()

    expect(
      screen.getByRole('region', { name: 'Série histórica do indicador' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Evolução do número de leitos'),
    ).toBeInTheDocument()
  })

  it('não mostra os dados de outros setores', async () => {
    render(<Dashboard />)

    await screen.findByRole('heading', { name: 'Número de leitos' })

    expect(screen.queryByText('Restaurantes')).not.toBeInTheDocument()
  })

  it('mostra o estado de carregando antes dos dados chegarem', async () => {
    render(<Dashboard />)

    expect(screen.getByText('Carregando indicadores...')).toBeInTheDocument()

    await screen.findByRole('heading', { name: 'Número de leitos' })
  })

  it('mostra mensagem de erro quando a API falha', async () => {
    stubApi({ ok: false })

    render(<Dashboard />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar o dashboard',
    )
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
  })

  it('mostra mensagem de sem dados quando a API devolve listas vazias', async () => {
    stubApi({ indicadores: [], destaques: [] })

    render(<Dashboard />)

    expect(
      await screen.findByText('Sem dados de hospedagem disponíveis no momento.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
  })

  it('não mostra um card quando o indicador não tem destaque correspondente', async () => {
    stubApi({
      indicadores: [
        {
          id: 1,
          nome: 'Número de leitos',
          unidade: 'leitos',
          setor: { id: 1, nome: 'Hospedagem' },
          medicoes: [{ ano: 2025, semestre: 2, valor: 350 }],
        },
      ],
      destaques: [],
    })

    render(<Dashboard />)

    expect(
      await screen.findByText('Sem dados de hospedagem disponíveis no momento.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
  })
})
