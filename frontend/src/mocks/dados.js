// Dados ilustrativos de backend/prisma/dados, incluindo o histórico do PR #117.
// IDs são locais ao mock; nomes, unidades, períodos e valores acompanham a carga.

export const mockSetores = [
  { id: 3, nome: 'Alimentação & Bares' },
  { id: 5, nome: 'Comércio Turístico' },
  { id: 1, nome: 'Hospedagem' },
  { id: 6, nome: 'Outros' },
  { id: 4, nome: 'Serviços & Eventos' },
  { id: 2, nome: 'Turismo' },
];

export const mockPeriodos = [
  { id: 1, ano: 2020, semestre: 2 },
  { id: 2, ano: 2021, semestre: 2 },
  { id: 3, ano: 2022, semestre: 2 },
  { id: 4, ano: 2023, semestre: 2 },
  { id: 5, ano: 2024, semestre: 2 },
  { id: 6, ano: 2025, semestre: 2 },
];

export const mockIndicadores = [
  {
    id: 1,
    nome: 'Número de leitos',
    unidade: 'leitos',
    setor: { id: 1, nome: 'Hospedagem' },
    medicoes: [
      { ano: 2023, semestre: 2, valor: 280 },
      { ano: 2024, semestre: 2, valor: 312 },
      { ano: 2025, semestre: 2, valor: 350 },
    ],
  },
  {
    id: 2,
    nome: 'Taxa de ocupação',
    unidade: '%',
    setor: { id: 1, nome: 'Hospedagem' },
    medicoes: [{ ano: 2025, semestre: 2, valor: 68 }],
  },
  {
    id: 3,
    nome: 'Fluxo de visitantes',
    unidade: 'visitantes',
    setor: { id: 2, nome: 'Turismo' },
    medicoes: [
      { ano: 2020, semestre: 2, valor: 1100 },
      { ano: 2021, semestre: 2, valor: 1900 },
      { ano: 2022, semestre: 2, valor: 2450 },
      { ano: 2023, semestre: 2, valor: 3600 },
      { ano: 2024, semestre: 2, valor: 4400 },
      { ano: 2025, semestre: 2, valor: 5200 },
    ],
  },
  {
    id: 4,
    nome: 'Número de empresas',
    unidade: 'empresas',
    setor: { id: 2, nome: 'Turismo' },
    medicoes: [
      { ano: 2023, semestre: 2, valor: 92 },
      { ano: 2024, semestre: 2, valor: 104 },
      { ano: 2025, semestre: 2, valor: 120 },
    ],
  },
  {
    id: 5,
    nome: 'Empregos no setor',
    unidade: 'empregos',
    setor: { id: 2, nome: 'Turismo' },
    medicoes: [
      { ano: 2023, semestre: 2, valor: 680 },
      { ano: 2024, semestre: 2, valor: 760 },
      { ano: 2025, semestre: 2, valor: 840 },
    ],
  },
  {
    id: 6,
    nome: 'Gasto médio do turista',
    unidade: 'R$',
    setor: { id: 2, nome: 'Turismo' },
    medicoes: [{ ano: 2025, semestre: 2, valor: 350 }],
  },
  {
    id: 7,
    nome: 'Tempo médio de permanência',
    unidade: 'dias',
    setor: { id: 2, nome: 'Turismo' },
    medicoes: [{ ano: 2025, semestre: 2, valor: 2.8 }],
  },
  ...[
    { id: 8, setorId: 1, valor: 28 },
    { id: 9, setorId: 3, valor: 24 },
    { id: 10, setorId: 4, valor: 20 },
    { id: 11, setorId: 5, valor: 18 },
    { id: 12, setorId: 6, valor: 10 },
  ].map(({ id, setorId, valor }) => ({
    id,
    nome: 'Participação econômica',
    unidade: '%',
    setor: mockSetores.find((setor) => setor.id === setorId),
    medicoes: [{ ano: 2025, semestre: 2, valor }],
  })),
].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

// A medição anterior vem da série completa, mesmo quando está fora do filtro.
export function montarDestaques(indicadores) {
  return indicadores.map((indicador) => {
    const atual = indicador.medicoes.at(-1);
    const historico = mockIndicadores.find((item) => item.id === indicador.id).medicoes;
    const anterior = historico[historico.findIndex((item) =>
      item.ano === atual.ano && item.semestre === atual.semestre) - 1];
    return {
      id: indicador.id,
      nome: indicador.nome,
      unidade: indicador.unidade,
      valor: atual.valor,
      periodo: { ano: atual.ano, semestre: atual.semestre },
      variacao_percentual: anterior && anterior.valor !== 0
        ? Math.round(((atual.valor - anterior.valor) / anterior.valor) * 1000) / 10
        : null,
    };
  });
}

export const mockDestaques = montarDestaques(mockIndicadores);

export default { mockSetores, mockPeriodos, mockIndicadores, mockDestaques };
