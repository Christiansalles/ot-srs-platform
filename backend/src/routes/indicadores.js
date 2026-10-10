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

function lerFiltros(query) {
  const setor = lerSetor(query);
  if (setor.erro) return setor;
  if (query.ano !== undefined &&
    (typeof query.ano !== 'string' || !/^\d{4}$/.test(query.ano))) {
    return { erro: 'ano deve ser um número inteiro de 4 dígitos' };
  }
  if (query.semestre !== undefined &&
    (typeof query.semestre !== 'string' || !/^[12]$/.test(query.semestre))) {
    return { erro: 'semestre deve ser 1 ou 2' };
  }
  if (query.semestre !== undefined && query.ano === undefined) {
    return { erro: 'semestre exige ano' };
  }
  return {
    setorId: setor.setorId,
    ano: query.ano === undefined ? undefined : Number(query.ano),
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
