import { describe, expect, it } from 'vitest'

import { montarCards } from '../utils/montarCards'

const item = (nome) => ({ id: nome, nome })

describe('montarCards', () => {
  it('tira a participação econômica', () => {
    const cards = montarCards([
      item('Participação econômica'),
      item('Taxa de ocupação'),
    ])

    expect(cards.map((card) => card.nome)).toEqual(['Taxa de ocupação'])
  })

  it('coloca os quatro do mockup primeiro e mantém a ordem dos outros', () => {
    const cards = montarCards([
      item('Empregos no setor'),
      item('Fluxo de visitantes'),
      item('Gasto médio do turista'),
      item('Número de empresas'),
      item('Número de leitos'),
      item('Taxa de ocupação'),
    ])

    expect(cards.map((card) => card.nome)).toEqual([
      'Número de leitos',
      'Fluxo de visitantes',
      'Número de empresas',
      'Empregos no setor',
      'Gasto médio do turista',
      'Taxa de ocupação',
    ])
  })

  it('não altera a lista recebida', () => {
    const destaques = [item('Taxa de ocupação'), item('Número de leitos')]

    montarCards(destaques)

    expect(destaques.map((d) => d.nome)).toEqual([
      'Taxa de ocupação',
      'Número de leitos',
    ])
  })

  it('devolve lista vazia quando não há destaques', () => {
    expect(montarCards([])).toEqual([])
  })
})