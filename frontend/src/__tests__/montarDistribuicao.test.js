import { describe, expect, it } from 'vitest'

import { mockIndicadores } from '../mocks/dados'
import { montarDistribuicao, periodoMaisRecente } from '../utils/montarDistribuicao'

function participacao(setor, medicoes) {
  return {
    id: setor,
    nome: 'Participação econômica',
    unidade: '%',
    setor: { id: setor, nome: setor },
    medicoes,
  }
}

describe('montarDistribuicao', () => {
  it('monta um item por setor com a participação do mock', () => {
    expect(montarDistribuicao(mockIndicadores)).toEqual([
      { nome: 'Hospedagem', valor: 28 },
      { nome: 'Alimentação & Bares', valor: 24 },
      { nome: 'Serviços & Eventos', valor: 20 },
      { nome: 'Comércio Turístico', valor: 18 },
      { nome: 'Outros', valor: 10 },
    ])
  })

  it('ordena do maior para o menor, mesmo quando a API devolve fora de ordem', () => {
    const dados = montarDistribuicao([
      participacao('Outros', [{ ano: 2025, semestre: 2, valor: 10 }]),
      participacao('Hospedagem', [{ ano: 2025, semestre: 2, valor: 28 }]),
      participacao('Comércio Turístico', [{ ano: 2025, semestre: 2, valor: 18 }]),
    ])

    expect(dados.map((item) => item.nome)).toEqual([
      'Hospedagem',
      'Comércio Turístico',
      'Outros',
    ])
  })

  it('ignora os indicadores que não são participação econômica', () => {
    const dados = montarDistribuicao([
      { id: 1, nome: 'Número de leitos', setor: { nome: 'Hospedagem' }, medicoes: [{ ano: 2025, semestre: 2, valor: 350 }] },
      participacao('Hospedagem', [{ ano: 2025, semestre: 2, valor: 28 }]),
    ])

    expect(dados).toEqual([{ nome: 'Hospedagem', valor: 28 }])
  })

  it('usa o período mais recente e deixa de fora o setor que não tem medição nele', () => {
    const dados = montarDistribuicao([
      participacao('Hospedagem', [
        { ano: 2024, semestre: 2, valor: 40 },
        { ano: 2025, semestre: 1, valor: 30 },
      ]),
      participacao('Outros', [{ ano: 2024, semestre: 2, valor: 60 }]),
    ])

    expect(dados).toEqual([{ nome: 'Hospedagem', valor: 30 }])
  })

  it('devolve lista vazia quando não há participação econômica', () => {
    expect(montarDistribuicao([])).toEqual([])
    expect(
      montarDistribuicao([
        { id: 1, nome: 'Número de leitos', setor: { nome: 'Hospedagem' }, medicoes: [{ ano: 2025, semestre: 2, valor: 350 }] },
      ]),
    ).toEqual([])
  })
})

describe('periodoMaisRecente', () => {
  it('devolve o período mais recente entre todos os setores', () => {
    const periodo = periodoMaisRecente([
      participacao('Hospedagem', [
        { ano: 2024, semestre: 2, valor: 40 },
        { ano: 2025, semestre: 1, valor: 30 },
      ]),
      participacao('Outros', [{ ano: 2025, semestre: 2, valor: 60 }]),
    ])

    expect(periodo).toEqual({ ano: 2025, semestre: 2 })
  })

  it('só considera a participação econômica', () => {
    const periodo = periodoMaisRecente([
      { id: 1, nome: 'Número de leitos', setor: { nome: 'Hospedagem' }, medicoes: [{ ano: 2026, semestre: 1, valor: 350 }] },
      participacao('Hospedagem', [{ ano: 2025, semestre: 2, valor: 28 }]),
    ])

    expect(periodo).toEqual({ ano: 2025, semestre: 2 })
  })

  it('devolve null quando não há participação econômica', () => {
    expect(periodoMaisRecente([])).toBeNull()
  })
})
