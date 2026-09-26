const { Router } = require('express');
const dados = require('../services/dados');
const { ordenarPeriodos } = require('../services/indicadores');

const router = Router();

router.get('/', async (req, res) => {
  const periodos = await dados.buscarPeriodos();
  res.json(ordenarPeriodos(periodos).map(({ id, ano, semestre }) => ({ id, ano, semestre })));
});

module.exports = router;
