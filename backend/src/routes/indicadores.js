const { Router } = require('express');
const dados = require('../services/dados');
const { formatarIndicadores, montarDestaques } = require('../services/indicadores');

const router = Router();

// `?setor=` é opcional. Quando vem, precisa ser um inteiro positivo;
// qualquer outra coisa (abc, 1.5, -1, vazio, repetido) é 400.
function lerSetor(query) {
  if (query.setor === undefined) {
    return { setorId: undefined };
  }
  if (typeof query.setor !== 'string' || !/^[1-9]\d*$/.test(query.setor)) {
    return { erro: 'setor deve ser um número inteiro positivo' };
  }
  return { setorId: Number(query.setor) };
}

router.get('/', async (req, res) => {
  const { setorId, erro } = lerSetor(req.query);
  if (erro) {
    return res.status(400).json({ erro });
  }

  const indicadores = await dados.buscarIndicadores({ setorId });
  res.json(formatarIndicadores(indicadores));
});

router.get('/destaques', async (req, res) => {
  const indicadores = await dados.buscarIndicadores({});
  res.json(montarDestaques(formatarIndicadores(indicadores)));
});

module.exports = router;
