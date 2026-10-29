const { Router } = require('express');
const dados = require('../services/dados');
const { formatarIndicadores, montarDestaques } = require('../services/indicadores');
const { lerSetor, lerAno } = require('../utils/filtros');

const router = Router();

function lerFiltros(query) {
  const setor = lerSetor(query);
  if (setor.erro) return setor;
  const { ano, erro } = lerAno(query);
  if (erro) return { erro };
  if (query.semestre !== undefined &&
    (typeof query.semestre !== 'string' || !/^[12]$/.test(query.semestre))) {
    return { erro: 'semestre deve ser 1 ou 2' };
  }
  if (query.semestre !== undefined && query.ano === undefined) {
    return { erro: 'semestre exige ano' };
  }
  return {
    setorId: setor.setorId,
    ano,
    semestre: query.semestre === undefined ? undefined : Number(query.semestre),
  };
}

router.get('/', async (req, res) => {
  const { setorId, ano, semestre, erro } = lerFiltros(req.query);
  if (erro) {
    return res.status(400).json({ erro });
  }

  const indicadores = await dados.buscarIndicadores({ setorId, ano, semestre });
  const resposta = formatarIndicadores(indicadores).map(({ medicoesCandidatasAnteriores, ...indicador }) => indicador);
  res.json(resposta);
});

router.get('/destaques', async (req, res) => {
  const { setorId, ano, semestre, erro } = lerFiltros(req.query);
  if (erro) {
    return res.status(400).json({ erro });
  }

  const indicadores = await dados.buscarIndicadores({ setorId, ano, semestre });
  res.json(montarDestaques(formatarIndicadores(indicadores)));
});

module.exports = router;
