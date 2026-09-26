const { Router } = require('express');
const dados = require('../services/dados');
const { ordenarSetores } = require('../services/indicadores');

const router = Router();

router.get('/', async (req, res) => {
  const setores = await dados.buscarSetores();
  res.json(ordenarSetores(setores).map(({ id, nome }) => ({ id, nome })));
});

module.exports = router;
