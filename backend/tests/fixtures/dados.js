// Dados de teste no formato que services/dados.js vai devolver.
// Os valores de hospedagem são os mesmos da carga (mockups do M3 no Stitch);
// o resto existe só para exercitar as regras do contrato.

const hospedagem = { id: 1, nome: 'Hospedagem' };
const gastronomia = { id: 2, nome: 'Gastronomia' };

const setores = [hospedagem, gastronomia];

const periodos = [
  { id: 3, ano: 2025, semestre: 1 },
  { id: 1, ano: 2023, semestre: 2 },
  { id: 4, ano: 2025, semestre: 2 },
  { id: 2, ano: 2024, semestre: 2 },
];

const indicadores = [
  {
    id: 2,
    nome: 'Taxa de ocupação',
    unidade: '%',
    setor: hospedagem,
    medicoes: [{ ano: 2025, semestre: 2, valor: '68.00', status: 'publicado' }],
  },
  {
    id: 1,
    nome: 'Número de leitos',
    unidade: 'leitos',
    setor: hospedagem,
    medicoes: [
      // Fora de ordem de propósito, e com valor como texto (Decimal do Prisma).
      { ano: 2025, semestre: 2, valor: '350.00', status: 'publicado' },
      { ano: 2023, semestre: 2, valor: '280.00', status: 'publicado' },
      { ano: 2024, semestre: 2, valor: '312.00', status: 'publicado' },
      // Rascunho mais recente: não pode aparecer nem virar o "atual" do destaque.
      { ano: 2026, semestre: 1, valor: '999.00', status: 'rascunho' },
    ],
  },
  {
    id: 3,
    nome: 'Diária média',
    unidade: 'R$',
    setor: hospedagem,
    // Só rascunho: o indicador inteiro fica de fora.
    medicoes: [{ ano: 2025, semestre: 2, valor: '285.00', status: 'rascunho' }],
  },
  {
    id: 4,
    nome: 'Restaurantes',
    unidade: 'estabelecimentos',
    setor: gastronomia,
    medicoes: [{ ano: 2025, semestre: 2, valor: '40.00', status: 'publicado' }],
  },
];

module.exports = { setores, periodos, indicadores };
