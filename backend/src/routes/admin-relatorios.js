const { Router } = require('express');
const autenticar = require('../middlewares/autenticar');
const exigirPerfil = require('../middlewares/exigir-perfil');
const dados = require('../services/dados');
const { formatarRelatorioAdmin } = require('../services/relatorios');
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
  const relatorio = id && await dados.atualizarStatusRelatorio(id, status);
  if (!relatorio) {
    return res.status(404).json({ erro: ERRO_NAO_ENCONTRADO });
  }

  return res.status(200).json(formatarRelatorioAdmin(relatorio));
});

module.exports = router;
