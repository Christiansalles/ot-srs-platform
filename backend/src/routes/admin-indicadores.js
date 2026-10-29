const { Router } = require('express');
const autenticar = require('../middlewares/autenticar');
const dados = require('../services/dados');
const { lerSetor } = require('../utils/filtros-indicadores');

const router = Router();
const STATUS_VALIDOS = ['rascunho', 'publicado'];

router.get('/', autenticar, async (req, res) => {
  const { setorId, erro: erroSetor } = lerSetor(req.query);
  if (erroSetor) {
    return res.status(400).json({ erro: erroSetor });
  }

  const status = req.query.status;
  if (status !== undefined && (typeof status !== 'string' || !STATUS_VALIDOS.includes(status))) {
    return res.status(400).json({ erro: 'Status inválido' });
  }

  const indicadores = await dados.buscarIndicadoresAdmin({ setorId, status });
  return res.status(200).json(indicadores);
});

module.exports = router;
