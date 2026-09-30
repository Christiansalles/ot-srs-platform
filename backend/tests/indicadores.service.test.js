const {
  calcularVariacaoPercentual,
  formatarIndicadores,
  montarDestaques,
} = require('../src/services/indicadores');
const fixtures = require('./fixtures/dados');

describe('calcularVariacaoPercentual', () => {
  it('bate com o cálculo feito à mão, com 1 casa decimal', () => {
    // (350 - 312) / 312 * 100 = 12,179... → 12.2
    expect(calcularVariacaoPercentual(350, 312)).toBe(12.2);
    // exemplo do contrato: (1280 - 1234) / 1234 * 100 = 3,727... → 3.7
    expect(calcularVariacaoPercentual(1280, 1234)).toBe(3.7);
  });

  it('funciona para queda', () => {
    // (280 - 312) / 312 * 100 = -10,256... → -10.3
    expect(calcularVariacaoPercentual(280, 312)).toBe(-10.3);
  });

  it('é null sem valor anterior ou com anterior igual a 0', () => {
    expect(calcularVariacaoPercentual(68, undefined)).toBeNull();
    expect(calcularVariacaoPercentual(68, null)).toBeNull();
    expect(calcularVariacaoPercentual(68, 0)).toBeNull();
  });
});

describe('montarDestaques', () => {
  const destaques = montarDestaques(formatarIndicadores(fixtures.indicadores));
  const leitos = destaques.find((d) => d.nome === 'Número de leitos');
  const ocupacao = destaques.find((d) => d.nome === 'Taxa de ocupação');

  it('compara com a medição publicada anterior, mesmo sem ser o semestre imediatamente anterior', () => {
    expect(leitos).toEqual({
      id: 1,
      nome: 'Número de leitos',
      unidade: 'leitos',
      valor: 350,
      periodo: { ano: 2025, semestre: 2 },
      variacao_percentual: 12.2,
    });
  });

  it('dá variação null quando o indicador só tem uma medição publicada', () => {
    expect(ocupacao.valor).toBe(68);
    expect(ocupacao.variacao_percentual).toBeNull();
  });
});
