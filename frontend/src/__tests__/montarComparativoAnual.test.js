import { describe, expect, it } from 'vitest'

import { mockIndicadores } from '../mocks/dados'
import { INDICADORES } from '../config/indicadores'
import {
  montarComparativoAnual,
} from '../utils/montarComparativoAnual'

function indicador(nome, medicoes, unidade = 'un') {
  return {
    id: nome,
    nome,
    unidade,
    setor: { id: 1, nome: 'Turismo' },
    medicoes,
  }
}

describe('montarComparativoAnual', () => {
  it('monta o comparativo para os quatro indicadores configurados', () => {
    const dados = montarComparativoAnual(mockIndicadores)

    expect(dados.map((item) => item.nome)).toEqual([
      INDICADORES.LEITOS,
      INDICADORES.VISITANTES,
      INDICADORES.EMPRESAS,
      INDICADORES.EMPREGOS,
    ])
  })

  it('usa os dois anos mais recentes de cada indicador', () => {
    const dados = montarComparativoAnual(mockIndicadores)

    dados.forEach((item) => {
      expect(item.anoAnterior).toBe(2024)
      expect(item.anoAtual).toBe(2025)
    })
  })

  it('mantém os valores reais dos dois anos', () => {
    const dados = montarComparativoAnual(mockIndicadores)

    expect(dados).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          nome: INDICADORES.LEITOS,
          valorAnterior: 312,
          valorAtual: 350,
        }),
        expect.objectContaining({
          nome: INDICADORES.VISITANTES,
          valorAnterior: 4400,
          valorAtual: 5200,
        }),
        expect.objectContaining({
          nome: INDICADORES.EMPRESAS,
          valorAnterior: 104,
          valorAtual: 120,
        }),
        expect.objectContaining({
          nome: INDICADORES.EMPREGOS,
          valorAnterior: 760,
          valorAtual: 840,
        }),
      ]),
    )
  })

  it('usa o ano anterior como índice 100', () => {
    const dados = montarComparativoAnual(mockIndicadores)

    expect(dados.every((item) => item.anterior === 100)).toBe(true)
  })

  it('calcula o índice do ano atual em relação ao anterior', () => {
    const dados = montarComparativoAnual(mockIndicadores)

    const leitos = dados.find(
      (item) => item.nome === INDICADORES.LEITOS,
    )

    const visitantes = dados.find(
      (item) => item.nome === INDICADORES.VISITANTES,
    )

    const empresas = dados.find(
      (item) => item.nome === INDICADORES.EMPRESAS,
    )

    const empregos = dados.find(
      (item) => item.nome === INDICADORES.EMPREGOS,
    )

    expect(leitos.atual).toBeCloseTo(112.18, 2)
    expect(visitantes.atual).toBeCloseTo(118.18, 2)
    expect(empresas.atual).toBeCloseTo(115.38, 2)
    expect(empregos.atual).toBeCloseTo(110.53, 2)
  })

  it('ignora indicadores que não fazem parte do comparativo anual', () => {
    const dados = montarComparativoAnual([
      indicador(
        INDICADORES.PARTICIPACAO,
        [
          { ano: 2024, semestre: 2, valor: 40 },
          { ano: 2025, semestre: 2, valor: 60 },
        ],
        '%',
      ),
      indicador(
        'Taxa de ocupação',
        [
          { ano: 2024, semestre: 2, valor: 60 },
          { ano: 2025, semestre: 2, valor: 68 },
        ],
        '%',
      ),
    ])

    expect(dados).toEqual([])
  })

  it('ignora indicadores que possuem apenas um ano', () => {
    const dados = montarComparativoAnual([
      indicador(INDICADORES.LEITOS, [
        { ano: 2025, semestre: 2, valor: 350 },
      ]),
    ])

    expect(dados).toEqual([])
  })

  it('funciona quando as medições chegam fora de ordem', () => {
    const dados = montarComparativoAnual([
      indicador(INDICADORES.LEITOS, [
        { ano: 2025, semestre: 2, valor: 350 },
        { ano: 2023, semestre: 2, valor: 280 },
        { ano: 2024, semestre: 2, valor: 312 },
      ]),
    ])

    expect(dados).toEqual([
      expect.objectContaining({
        nome: INDICADORES.LEITOS,
        anoAnterior: 2024,
        anoAtual: 2025,
        valorAnterior: 312,
        valorAtual: 350,
        anterior: 100,
        atual: expect.closeTo(112.18, 2),
      }),
    ])
  })

  it('considera os dois anos mais recentes mesmo quando existem anos anteriores', () => {
    const dados = montarComparativoAnual([
      indicador(INDICADORES.LEITOS, [
        { ano: 2021, semestre: 2, valor: 200 },
        { ano: 2022, semestre: 2, valor: 240 },
        { ano: 2023, semestre: 2, valor: 280 },
        { ano: 2024, semestre: 2, valor: 312 },
        { ano: 2025, semestre: 2, valor: 350 },
      ]),
    ])

    expect(dados[0]).toEqual(
      expect.objectContaining({
        anoAnterior: 2024,
        anoAtual: 2025,
        valorAnterior: 312,
        valorAtual: 350,
      }),
    )
  })

  it('mantém a unidade do indicador para uso na apresentação', () => {
    const dados = montarComparativoAnual([
      indicador(
        INDICADORES.VISITANTES,
        [
          { ano: 2024, semestre: 2, valor: 4400 },
          { ano: 2025, semestre: 2, valor: 5200 },
        ],
        'visitantes',
      ),
    ])

    expect(dados[0].unidade).toBe('visitantes')
  })

  it('devolve lista vazia quando não recebe indicadores', () => {
    expect(montarComparativoAnual([])).toEqual([])
  })

  it('compara o ano informado com o ano anterior usando o semestre informado', () => {
    const dados = montarComparativoAnual(
      [
        indicador(INDICADORES.LEITOS, [
          { ano: 2024, semestre: 2, valor: 312 },
          { ano: 2025, semestre: 2, valor: 350 },
        ]),
      ],
      {
        ano: 2025,
        semestre: 2,
      },
    )

    expect(dados[0]).toEqual(
      expect.objectContaining({
        nome: INDICADORES.LEITOS,
        anoAnterior: 2024,
        anoAtual: 2025,
        valorAnterior: 312,
        valorAtual: 350,
        anterior: 100,
        atual: expect.closeTo(112.18, 2),
      }),
    )
  })

  it('usa o último semestre disponível quando o ano é informado sem semestre', () => {
    const dados = montarComparativoAnual(
      [
        indicador(INDICADORES.LEITOS, [
          { ano: 2024, semestre: 1, valor: 300 },
          { ano: 2024, semestre: 2, valor: 312 },
          { ano: 2025, semestre: 1, valor: 340 },
          { ano: 2025, semestre: 2, valor: 350 },
        ]),
      ],
      {
        ano: 2025,
      },
    )

    expect(dados[0]).toEqual(
      expect.objectContaining({
        anoAnterior: 2024,
        anoAtual: 2025,
        valorAnterior: 312,
        valorAtual: 350,
      }),
    )
  })

  it('compara o mesmo semestre dos dois anos quando o semestre é informado', () => {
    const dados = montarComparativoAnual(
      [
        indicador(INDICADORES.LEITOS, [
          { ano: 2024, semestre: 1, valor: 300 },
          { ano: 2024, semestre: 2, valor: 312 },
          { ano: 2025, semestre: 1, valor: 340 },
          { ano: 2025, semestre: 2, valor: 350 },
        ]),
      ],
      {
        ano: 2025,
        semestre: 1,
      },
    )

    expect(dados[0]).toEqual(
      expect.objectContaining({
        anoAnterior: 2024,
        anoAtual: 2025,
        valorAnterior: 300,
        valorAtual: 340,
      }),
    )
  })

  it('ignora o indicador quando não existe o semestre correspondente no ano anterior', () => {
    const dados = montarComparativoAnual(
      [
        indicador(INDICADORES.LEITOS, [
          { ano: 2024, semestre: 1, valor: 300 },
          { ano: 2025, semestre: 2, valor: 350 },
        ]),
      ],
      {
        ano: 2025,
        semestre: 2,
      },
    )

    expect(dados).toEqual([])
  })
})
