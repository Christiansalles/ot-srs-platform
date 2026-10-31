import { mockSetores, mockIndicadores } from './dados';

// Os ids refletem a ordem determinística do seed em um banco vazio.
const idsMedicoesPorIndicador = {
  1: [1, 2, 3],
  2: [4],
  3: [5],
  4: [6],
  5: [7],
  6: [8],
  7: [9],
  8: [10, 11, 12, 13, 14, 15],
  9: [16, 17, 18],
  10: [19, 20, 21],
  11: [22],
  12: [23],
};

const descricoes = {
  1: 'Número de leitos disponíveis nos meios de hospedagem.',
  2: 'Taxa de ocupação dos meios de hospedagem.',
  3: 'Participação econômica dos setores relacionados ao turismo.',
  4: 'Participação econômica dos setores relacionados ao turismo.',
  5: 'Participação econômica dos setores relacionados ao turismo.',
  6: 'Participação econômica dos setores relacionados ao turismo.',
  7: 'Participação econômica dos setores relacionados ao turismo.',
  8: 'Fluxo de visitantes no setor de turismo.',
  9: 'Número de empresas atuantes no setor de turismo.',
  10: 'Número de empregos no setor de turismo.',
  11: 'Gasto médio realizado por turista.',
  12: 'Tempo médio de permanência dos turistas.',
};

export const mockIndicadoresAdmin = mockIndicadores.map((indicador) => ({
  ...indicador,
  descricao: descricoes[indicador.id],
  medicoes: indicador.medicoes.map((medicao, indice) => {
    const id = idsMedicoesPorIndicador[indicador.id][indice];
    return {
      id,
      ...medicao,
      // O rascunho demonstra o estado de edição no painel; o seed publica os dados iniciais.
      status: id === 7 ? 'rascunho' : 'publicado',
    };
  }),
}));

export const mockRelatoriosAdmin = [
  {
    id: 1,
    titulo: 'Indicadores do setor hoteleiro',
    edicao: 'OT-ILUS-01/2025',
    categoria: 'Setor Hoteleiro',
    data_publicacao: '2026-10-21',
    descricao: 'Indicadores ilustrativos de leitos disponíveis e taxa de ocupação dos meios de hospedagem, derivados dos protótipos do Milestone III. Aguarda os dados oficiais da SMCELT.',
    tamanho_kb: 193,
    url_arquivo: '/api/relatorios/1/arquivo',
    status: 'publicado',
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
    status: 'publicado',
  },
];

export function criarEstadoAdminMock() {
  return {
    indicadores: structuredClone(mockIndicadoresAdmin),
    relatorios: structuredClone(mockRelatoriosAdmin),
  };
}

export function criarMockIndicador(dados, id) {
  const setor = mockSetores.find((item) => item.id === Number(dados.id_setor));
  return {
    id,
    nome: dados.nome,
    unidade: dados.unidade,
    descricao: dados.descricao ?? null,
    setor: setor ? { id: setor.id, nome: setor.nome } : null,
    medicoes: [],
  };
}
