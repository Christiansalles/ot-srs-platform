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

function validarValor(valor) {
  return typeof valor === 'number' && Number.isFinite(valor) && valor >= 0
    && valor <= 9999999999.99 && /^\d{1,10}(\.\d{1,2})?$/.test(String(valor));
}

function validarPeriodo(ano, semestre) {
  if (ano !== undefined && (!Number.isInteger(ano) || !/^\d{4}$/.test(String(ano)) || ano > 32767)) return false;
  if (semestre !== undefined && semestre !== 1 && semestre !== 2) return false;
  return true;
}

function validarMedicao(body) {
  const b = body || {};
  if (!Number.isInteger(b.id_indicador) || b.id_indicador <= 0
      || !validarPeriodo(b.ano, b.semestre) || b.ano === undefined || b.semestre === undefined
      || !validarValor(b.valor)) return 'Campos obrigatórios inválidos';
  return null;
}

function validarEdicaoMedicao(body) {
  const b = body || {};
  if (!validarValor(b.valor) || !validarPeriodo(b.ano, b.semestre)) return 'Campos obrigatórios inválidos';
  return null;
}

function erroConflito(medicao) {
  return { erro: `Já existe uma medição deste indicador em ${medicao.ano}/${medicao.semestre}` };
}

router.post('/', autenticar, async (req, res) => {
  const erro = validarMedicao(req.body);
  if (erro) return res.status(400).json({ erro });
  const { id_indicador, ano, semestre, valor } = req.body;
  const medicao = await dados.criarMedicao({ id_indicador, ano, semestre, valor, id_usuario: req.usuario.id });
  if (medicao?.conflito) return res.status(409).json(erroConflito(medicao));
  if (medicao?.indicadorInvalido) return res.status(400).json({ erro: 'Campos obrigatórios inválidos' });
  return res.status(201).json(medicao);
});

router.put('/:id', autenticar, async (req, res) => {
  const id = lerId(req.params.id);
  if (!id) return res.status(404).json({ erro: ERRO_NAO_ENCONTRADO });
  const erro = validarEdicaoMedicao(req.body);
  if (erro) return res.status(400).json({ erro });
  const { valor, ano, semestre } = req.body;
  const medicao = await dados.atualizarMedicao(id, { valor, ano, semestre });
  if (medicao?.publicada) return res.status(409).json({ erro: 'Despublique a medição antes de editar' });
  if (medicao?.conflito) return res.status(409).json(erroConflito(medicao));
  if (medicao?.naoEncontrada || !medicao) return res.status(404).json({ erro: ERRO_NAO_ENCONTRADO });
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
