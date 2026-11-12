import { describe, expect, it } from 'vitest'

import { formatarData } from '../utils/formatarData'

describe('formatarData', () => {
  it('formata a data ISO em dd/mm/aaaa', () => {
    expect(formatarData('2026-11-03T14:20:00.000Z')).toBe('03/11/2026')
  })

  it('usa o fuso de Brasília, não o UTC', () => {
    // 01:30 UTC de 04/11 ainda é 22:30 de 03/11 em Brasília
    expect(formatarData('2026-11-04T01:30:00.000Z')).toBe('03/11/2026')
  })

  it('devolve texto vazio para null, vazio ou data inválida', () => {
    expect(formatarData(null)).toBe('')
    expect(formatarData(undefined)).toBe('')
    expect(formatarData('')).toBe('')
    expect(formatarData('não é data')).toBe('')
  })
})
