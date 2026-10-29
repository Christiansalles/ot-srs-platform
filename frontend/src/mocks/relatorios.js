import { CATEGORIAS_RELATORIO } from '../config/relatorios';

// Metadados de backend/prisma/dados/relatorios/relatorios.json.
// IDs seguem a ordem do seed do PR #198 em banco vazio; tamanhos em KB,
// arredondados para cima a partir dos bytes dos PDFs, como na carga.
export const mockRelatorios = [
  {
    id: 1,
    titulo: 'Indicadores do setor hoteleiro',
    edicao: 'OT-ILUS-01/2025',
    categoria: 'Setor Hoteleiro',
    data_publicacao: '2026-10-21',
    descricao: 'Indicadores ilustrativos de leitos disponíveis e taxa de ocupação dos meios de hospedagem, derivados dos protótipos do Milestone III. Aguarda os dados oficiais da SMCELT.',
    tamanho_kb: 193,
    url_arquivo: '/api/relatorios/1/arquivo',
  },
  {
    id: 2,
    titulo: 'Participação econômica do turismo',
    edicao: 'OT-ILUS-02/2025',
    categoria: 'Impacto Econômico',
    data_publicacao: '2026-10-21',
    descricao: 'Distribuição ilustrativa da participação econômica entre setores relacionados ao turismo, derivada dos protótipos do Milestone III. Aguarda os dados oficiais da SMCELT.',
    tamanho_kb: 231,
    url_arquivo: '/api/relatorios/2/arquivo',
  },
];

export function filtrarRelatoriosMock(params) {
  if (params.has('ano') && !/^\d{4}$/.test(params.get('ano'))) {
    throw new Error('ano deve ser um número inteiro de 4 dígitos');
  }
  if (params.has('categoria') && !CATEGORIAS_RELATORIO.includes(params.get('categoria'))) {
    throw new Error('Categoria inválida');
  }

  return mockRelatorios
    .filter((relatorio) =>
      (!params.has('ano') || relatorio.data_publicacao.slice(0, 4) === params.get('ano')) &&
      (!params.has('categoria') || relatorio.categoria === params.get('categoria')))
    .sort((a, b) => b.data_publicacao.localeCompare(a.data_publicacao) || b.id - a.id);
}
