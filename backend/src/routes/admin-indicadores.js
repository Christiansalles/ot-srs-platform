const { Router } = require('express');
const autenticar = require('../middlewares/autenticar');
const dados = require('../services/dados');
const { lerSetor } = require('../utils/filtros');
const { lerId, ERRO_NAO_ENCONTRADO } = require('../services/status');

const router = Router();
const STATUS_VALIDOS = ['rascunho', 'publicado'];
const TAMANHOS = { nome: 80, descricao: 200, unidade: 20 };
function validarIndicador(body) {
  const b = body || {};
  if (!Number.isInteger(b.id_setor) || b.id_setor <= 0) return 'Campos obrigatórios inválidos';
  for (const campo of ['nome', 'unidade']) {
    if (typeof b[campo] !== 'string' || b[campo].trim().length === 0 || b[campo].length > TAMANHOS[campo]) return 'Campos obrigatórios inválidos';
  }
  if (b.descricao !== undefined && b.descricao !== null && (typeof b.descricao !== 'string' || b.descricao.length > TAMANHOS.descricao)) return 'Campos obrigatórios inválidos';
  return null;
}

router.post('/', autenticar, async (req, res) => {
  const erro = validarIndicador(req.body);
  if (erro) return res.status(400).json({ erro });
  const { id_setor, descricao } = req.body;
  const indicador = await dados.criarIndicador({
    id_setor,
    nome: req.body.nome.trim(),
    descricao,
    unidade: req.body.unidade.trim(),
  });
  if (!indicador) return res.status(400).json({ erro: 'Campos obrigatórios inválidos' });
  return res.status(201).json(indicador);
});

router.put('/:id', autenticar, async (req, res) => {
  const id = lerId(req.params.id);
  if (!id) return res.status(404).json({ erro: ERRO_NAO_ENCONTRADO });
  const erro = validarIndicador(req.body);
  if (erro) return res.status(400).json({ erro });
  const { id_setor, descricao } = req.body;
  const indicador = await dados.atualizarIndicador(id, {
    id_setor,
    nome: req.body.nome.trim(),
    descricao,
    unidade: req.body.unidade.trim(),
  });
  if (indicador?.setorInvalido) return res.status(400).json({ erro: 'Campos obrigatórios inválidos' });
  if (!indicador) return res.status(404).json({ erro: ERRO_NAO_ENCONTRADO });
  return res.status(200).json(indicador);
});

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
