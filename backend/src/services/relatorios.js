// Regras do contrato para relatórios: categorias aceitas e o formato público.

// As do mockup da Tela 8, escritas exatamente assim.
const CATEGORIAS_RELATORIO = [
  'Perfil de Demanda',
  'Setor Hoteleiro',
  'Impacto Econômico',
  'Diagnóstico Estratégico',
];

// data_publicacao é DATE no banco: vira "AAAA-MM-DD", sem horário.
// url_arquivo aponta para a rota de download, nunca para o disco.
function formatarRelatorio(relatorio) {
  return {
    id: relatorio.id,
    titulo: relatorio.titulo,
    edicao: relatorio.edicao,
    categoria: relatorio.categoria,
    data_publicacao: relatorio.data_publicacao.toISOString().slice(0, 10),
    descricao: relatorio.descricao,
    tamanho_kb: relatorio.tamanho_kb,
    url_arquivo: `/api/relatorios/${relatorio.id}/arquivo`,
  };
}

// Formato do painel (GET /api/admin/relatorios e PATCH .../status):
// os mesmos campos da rota pública, mais o status.
function formatarRelatorioAdmin(relatorio) {
  return { ...formatarRelatorio(relatorio), status: relatorio.status };
}

module.exports = {
  CATEGORIAS_RELATORIO,
  formatarRelatorio,
  formatarRelatorioAdmin,
};
