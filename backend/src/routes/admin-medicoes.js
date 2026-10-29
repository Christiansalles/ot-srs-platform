const { Router } = require('express');
const autenticar = require('../middlewares/autenticar');
const exigirPerfil = require('../middlewares/exigir-perfil');
const dados = require('../services/dados');
const {
  ERRO_STATUS,
  ERRO_NAO_ENCONTRADO,
  lerId,
  lerStatus,
} = require('../services/status');

const router = Router();

// Só o administrador publica ou despublica; o editor recebe 403.
router.patch('/:id/status', autenticar, exigirPerfil('administrador'), async (req, res) => {
  const status = lerStatus(req.body);
  if (!status) {
    return res.status(400).json({ erro: ERRO_STATUS });
  }

  const id = lerId(req.params.id);
  const medicao = id && await dados.atualizarStatusMedicao(id, status);
  if (!medicao) {
    return res.status(404).json({ erro: ERRO_NAO_ENCONTRADO });
  }

  return res.status(200).json(medicao);
});

module.exports = router;
