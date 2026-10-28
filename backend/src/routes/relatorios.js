const { Router } = require('express');
const dados = require('../services/dados');
const { CATEGORIAS_RELATORIO, formatarRelatorio } = require('../services/relatorios');
const { lerAno } = require('../services/filtros');

const router = Router();

// `?categoria=` é opcional. Quando vem, precisa ser uma das categorias do
// contrato, escrita exatamente igual; repetida ou desconhecida é 400.
function lerFiltros(query) {
  const { ano, erro } = lerAno(query);
  if (erro) return { erro };
  if (query.categoria !== undefined && !CATEGORIAS_RELATORIO.includes(query.categoria)) {
    return { erro: 'Categoria inválida' };
  }
  return { ano, categoria: query.categoria };
}

router.get('/', async (req, res) => {
  const { ano, categoria, erro } = lerFiltros(req.query);
  if (erro) {
    return res.status(400).json({ erro });
  }

  const relatorios = await dados.buscarRelatoriosPublicados({ ano, categoria });
  res.json(relatorios.map(formatarRelatorio));
});

module.exports = router;
