import { describe, expect, it } from 'vitest'

import { formatarValor, separarValor } from '../utils/formatarValor'

describe('formatarValor', () => {
  it('coloca R$ antes do valor', () => {
    expect(formatarValor(350, 'R$')).toBe('R$ 350')
  })

  it('usa duas casas decimais em R$ quando o valor não é inteiro', () => {
    expect(formatarValor(350.5, 'R$')).toBe('R$ 350,50')
  })

  it('cola o % no valor', () => {
    expect(formatarValor(68, '%')).toBe('68%')
    expect(formatarValor(68.5, '%')).toBe('68,5%')
  })

  it('escreve a unidade em palavra depois do valor', () => {
    expect(formatarValor(2.8, 'dias')).toBe('2,8 dias')
    expect(formatarValor(5200, 'visitantes')).toBe('5.200 visitantes')
  })

  it('mantém o texto já formatado e formata só números', () => {
    expect(formatarValor('1.240', 'visitantes')).toBe('1.240 visitantes')
  })

  it('mostra só o valor quando não há unidade', () => {
    expect(formatarValor(350)).toBe('350')
    expect(formatarValor(350, '')).toBe('350')
  })

  it('devolve texto vazio, sem a unidade, quando não há valor', () => {
    expect(formatarValor(undefined, 'dias')).toBe('')
    expect(formatarValor(null, 'R$')).toBe('')
    expect(formatarValor(null, '%')).toBe('')
  })
})

describe('separarValor', () => {
  it('mantém R$ e % junto do valor, sem rótulo', () => {
    expect(separarValor(350, 'R$')).toEqual({ principal: 'R$ 350', rotulo: '' })
    expect(separarValor(68, '%')).toEqual({ principal: '68%', rotulo: '' })
  })

  it('separa o rótulo quando a unidade é uma palavra', () => {
    expect(separarValor(2.8, 'dias')).toEqual({ principal: '2,8', rotulo: 'dias' })
  })
})