const { Router } = require('express');
const multer = require('multer');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const autenticar = require('../middlewares/autenticar');
const exigirPerfil = require('../middlewares/exigir-perfil');
const dados = require('../services/dados');
const { CATEGORIAS_RELATORIO, formatarRelatorioAdmin } = require('../services/relatorios');
const {
  ERRO_STATUS,
  ERRO_NAO_ENCONTRADO,
  lerId,
  lerStatus,
} = require('../services/status');

const router = Router();
const DIRETORIO_UPLOADS = path.resolve(__dirname, '../../uploads');
const LIMITE_ARQUIVO = 10 * 1024 * 1024;
fs.mkdirSync(DIRETORIO_UPLOADS, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: DIRETORIO_UPLOADS,
    filename: (req, file, callback) => callback(null, `${crypto.randomUUID()}.pdf`),
  }),
  limits: { fileSize: LIMITE_ARQUIVO, files: 1 },
});

function receberArquivo(req, res, next) {
  upload.single('arquivo')(req, res, (erro) => {
    if (!erro) return next();
    if (erro.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ erro: 'Arquivo muito grande' });
    return res.status(400).json({ erro: 'Arquivo PDF obrigatório' });
  });
}

function camposValidos(body) {
  const limites = { titulo: 150, edicao: 20, categoria: 40, descricao: 500 };
  if (!body || typeof body !== 'object') return false;
  if (Object.entries(limites).some(([campo, limite]) => (
    typeof body[campo] !== 'string' || body[campo].trim().length === 0 || body[campo].length > limite
  ))) return false;
  if (!CATEGORIAS_RELATORIO.includes(body.categoria)) return false;
  if (typeof body.data_publicacao !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.data_publicacao)) return false;
  const data = new Date(`${body.data_publicacao}T00:00:00.000Z`);
  return !Number.isNaN(data.valueOf()) && data.toISOString().slice(0, 10) === body.data_publicacao;
}

router.get('/', autenticar, async (req, res) => {
  const relatorios = await dados.buscarRelatoriosAdmin();
  return res.json(relatorios.map(formatarRelatorioAdmin));
});

router.post('/', autenticar, receberArquivo, async (req, res) => {
  const arquivo = req.file;
  if (!camposValidos(req.body) || !arquivo) {
    if (arquivo) await fs.promises.unlink(arquivo.path).catch(() => {});
    return res.status(400).json({ erro: 'Campos obrigatórios inválidos' });
  }

  const inicio = Buffer.alloc(4);
  const handle = await fs.promises.open(arquivo.path, 'r');
  try {
    await handle.read(inicio, 0, inicio.length, 0);
  } finally {
    await handle.close();
  }
  if (arquivo.mimetype !== 'application/pdf' || inicio.toString('ascii') !== '%PDF') {
    await fs.promises.unlink(arquivo.path).catch(() => {});
    return res.status(400).json({ erro: 'Arquivo PDF obrigatório' });
  }

  try {
    const relatorio = await dados.criarRelatorio({
      id_usuario: req.usuario.id,
      titulo: req.body.titulo.trim(),
      edicao: req.body.edicao.trim(),
      categoria: req.body.categoria,
      data_publicacao: new Date(`${req.body.data_publicacao}T00:00:00.000Z`),
      descricao: req.body.descricao.trim(),
      arquivo_url: path.basename(arquivo.path),
      tamanho_kb: Math.ceil(arquivo.size / 1024),
    });
    return res.status(201).json(formatarRelatorioAdmin(relatorio));
  } catch (erro) {
    await fs.promises.unlink(arquivo.path).catch(() => {});
    throw erro;
  }
});

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
