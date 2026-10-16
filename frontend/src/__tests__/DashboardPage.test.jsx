import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import DashboardPage from '../pages/Dashboard/DashboardPage'

function stubApi({ indicadores = [], destaques = [], ok = true } = {}) {
  vi.stubEnv('VITE_USE_MOCK', 'false')

  const fetchMock = vi.fn().mockImplementation((url) => {
    if (!ok) {
      return Promise.resolve({ ok: false, status: 503 })
    }

    if (url.includes('/periodos')) {
      return Promise.resolve({
        ok: true,
        json: async () => [
          { ano: 2025 },
          { ano: 2024 },
        ],
      })
    }

    if (url.includes('/setores')) {
      return Promise.resolve({
        ok: true,
        json: async () => [
          { id: 1, nome: 'Hospedagem' },
        ],
      })
    }

    const dados = url.includes('/destaques')
      ? destaques
      : indicadores

    return Promise.resolve({
      ok: true,
      json: async () => dados,
    })
  })

  vi.stubGlobal('fetch', fetchMock)

  return fetchMock
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

function renderDashboard(url = '/') {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <DashboardPage />
    </MemoryRouter>,
  )
}

function chamadaComUrl(fetchMock, trecho) {
  return fetchMock.mock.calls.some(([url]) =>
    url.includes(trecho),
  )
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

    renderDashboard()

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
    renderDashboard()

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

    renderDashboard()

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

    renderDashboard()

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

    renderDashboard()

    expect(
      await screen.findByText('Sem indicadores disponíveis no momento.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('region', { name: 'Série histórica do indicador' }),
    ).not.toBeInTheDocument()
  })

  it('mostra o estado de carregando antes dos dados chegarem', async () => {
    renderDashboard()

    expect(screen.getByText('Carregando indicadores...')).toBeInTheDocument()

    await screen.findAllByRole('article')
  })

  it('mostra mensagem de erro quando a API falha', async () => {
    stubApi({ ok: false })

    renderDashboard()

    expect(
      await screen.findByText(
        'Não foi possível carregar o dashboard agora.',
      ),
    ).toBeInTheDocument()

    expect(screen.queryByRole('article')).not.toBeInTheDocument()
  })

  it('mostra mensagem de sem dados quando a API devolve listas vazias', async () => {
    stubApi({ indicadores: [], destaques: [] })

    renderDashboard()

    expect(
      await screen.findByText('Sem indicadores disponíveis no momento.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
  })

  it('mostra a rosca de distribuição por setor com o ano e os setores do mock', async () => {
    renderDashboard()

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

    renderDashboard()

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
    renderDashboard()

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

  it('consulta a API com os filtros presentes na URL', async () => {
    const fetchMock = vi.fn().mockImplementation((url) => {
      if (url.includes('/destaques')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            destaque(1, 'Número de leitos'),
          ],
        })
      }

      return Promise.resolve({
        ok: true,
        json: async () => [
          indicador(1, 'Número de leitos'),
        ],
      })
    })

    vi.stubEnv('VITE_USE_MOCK', 'false')
    vi.stubGlobal('fetch', fetchMock)

    renderDashboard('/?setor=1&ano=2024&semestre=2')

    await screen.findAllByRole('article')

    expect(
      chamadaComUrl(
        fetchMock,
        '/api/indicadores/destaques?setor=1&ano=2024&semestre=2',
      )
    ).toBe(true)

    expect(
      chamadaComUrl(
        fetchMock,
        '/api/indicadores?setor=1&ano=2024&semestre=2',
      )
    ).toBe(true)
  })

  it('reconsulta a API quando o filtro de ano muda', async () => {
    const fetchMock = stubApi({
      indicadores: [
        indicador(1, 'Número de leitos'),
      ],
      destaques: [
        destaque(1, 'Número de leitos'),
      ],
    })

    renderDashboard()

    await screen.findAllByRole('article')

    const chamadasAntes = fetchMock.mock.calls.length

    const periodo = screen.getByRole('combobox', {
      name: 'Período',
    })

    fireEvent.change(periodo, {
      target: { value: '2024' },
    })

    await waitFor(() => {
      expect(fetchMock.mock.calls.length).toBeGreaterThan(
        chamadasAntes,
      )
    })

    expect(
      chamadaComUrl(
        fetchMock,
        '/api/indicadores/destaques?ano=2024',
      )
    ).toBe(true)

    expect(
      chamadaComUrl(
        fetchMock,
        '/api/indicadores?ano=2024',
      )
    ).toBe(true)
  })

  it('consulta a API com os filtros de ano, semestre e setor', async () => {
    const fetchMock = stubApi({
      indicadores: [
        indicador(1, 'Número de leitos'),
      ],
      destaques: [
        destaque(1, 'Número de leitos'),
      ],
    })

    renderDashboard()

    await screen.findAllByRole('article')

    const periodo = screen.getByRole('combobox', {
      name: 'Período',
    })

    const semestre = screen.getByRole('combobox', {
      name: 'Semestre',
    })

    const setor = screen.getByRole('combobox', {
      name: 'Setor',
    })

    fireEvent.change(periodo, {
      target: { value: '2024' },
    })

    fireEvent.change(semestre, {
      target: { value: '2' },
    })

    fireEvent.change(setor, {
      target: { value: '1' },
    })

    await waitFor(() => {
      expect(chamadaComUrl(
        fetchMock,
        '/api/indicadores/destaques?setor=1&ano=2024&semestre=2',
      )).toBe(true)

      expect(chamadaComUrl(
        fetchMock,
        '/api/indicadores?setor=1&ano=2024&semestre=2',
      )).toBe(true)
    })
  })

})
