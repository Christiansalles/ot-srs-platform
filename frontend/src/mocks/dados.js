export const mockSetores = [
  { id: 1, nome: 'Hospedagem' },
  { id: 2, nome: 'Gastronomia' },
];

export const mockPeriodos = [
  { id: 1, ano: 2023, semestre: 2 },
  { id: 2, ano: 2024, semestre: 2 },
  { id: 3, ano: 2025, semestre: 1 },
  { id: 4, ano: 2025, semestre: 2 },
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
    id: 4,
    nome: 'Restaurantes',
    unidade: 'estabelecimentos',
    setor: { id: 2, nome: 'Gastronomia' },
    medicoes: [{ ano: 2025, semestre: 2, valor: 40 }],
  },
];

export const mockDestaques = [
  {
    id: 1,
    nome: 'Número de leitos',
    unidade: 'leitos',
    valor: 350,
    periodo: { ano: 2025, semestre: 2 },
    variacao_percentual: 12.2,
  },
  {
    id: 2,
    nome: 'Taxa de ocupação',
    unidade: '%',
    valor: 68,
    periodo: { ano: 2025, semestre: 2 },
    variacao_percentual: null,
  },
  {
    id: 4,
    nome: 'Restaurantes',
    unidade: 'estabelecimentos',
    valor: 40,
    periodo: { ano: 2025, semestre: 2 },
    variacao_percentual: null,
  },
];

export default {
  mockSetores,
  mockPeriodos,
  mockIndicadores,
  mockDestaques,
};
