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

function validarMedicao(body) {
  const b = body || {};
  if (!Number.isInteger(b.id_indicador) || b.id_indicador <= 0) return 'id_indicador deve ser um inteiro positivo';
  if (!Number.isInteger(b.ano) || !/^\d{4}$/.test(String(b.ano)) || b.ano > 32767) return 'ano deve ter 4 dígitos';
  if (b.semestre !== 1 && b.semestre !== 2) return 'semestre deve ser 1 ou 2';
  if (typeof b.valor !== 'number' || !Number.isFinite(b.valor) || b.valor < 0 || b.valor > 9999999999.99
      || !/^\d{1,10}(\.\d{1,2})?$/.test(String(b.valor))) return 'valor deve ser numérico, não negativo e ter até 2 casas decimais';
  return null;
}

router.post('/', autenticar, async (req, res) => {
  const erro = validarMedicao(req.body);
  if (erro) return res.status(400).json({ erro });
  const medicao = await dados.criarMedicao({ ...req.body, id_usuario: req.usuario.id });
  if (medicao?.conflito) return res.status(409).json({ erro: 'Medição já cadastrada para este indicador e período' });
  if (!medicao) return res.status(400).json({ erro: 'Indicador inválido' });
  return res.status(201).json(medicao);
});

router.put('/:id', autenticar, async (req, res) => {
  const id = lerId(req.params.id);
  if (!id) return res.status(404).json({ erro: ERRO_NAO_ENCONTRADO });
  const erro = validarMedicao(req.body);
  if (erro) return res.status(400).json({ erro });
  const status = await dados.buscarStatusMedicao(id);
  if (!status) return res.status(404).json({ erro: ERRO_NAO_ENCONTRADO });
  if (status === 'publicado') return res.status(409).json({ erro: 'Medição publicada não pode ser editada' });
  const medicao = await dados.atualizarMedicao(id, req.body);
  if (medicao?.conflito) return res.status(409).json({ erro: 'Medição já cadastrada para este indicador e período' });
  if (!medicao) return res.status(404).json({ erro: ERRO_NAO_ENCONTRADO });
  return res.status(200).json(medicao);
});

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
