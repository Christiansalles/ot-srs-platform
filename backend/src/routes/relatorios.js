const { Router } = require('express');
const dados = require('../services/dados');
const { CATEGORIAS_RELATORIO, formatarRelatorio } = require('../services/relatorios');
const { lerAno } = require('../utils/filtros');
const fs = require('node:fs/promises');
const path = require('node:path');
const { uploadsDir } = require('../config/uploads');
const { lerId } = require('../services/status');

const router = Router();

// `?categoria=` é opcional. Quando vem, precisa ser uma das categorias do
// contrato, escrita exatamente igual; repetida ou desconhecida é 400.
function lerFiltros(query) {
  const { ano, erro } = lerAno(query);
  if (erro) return { erro };
  if (query.categoria !== undefined && !CATEGORIAS_RELATORIO.includes(query.categoria)) {
    return { erro: 'Categoria inválida' };
  }
  return { ano, categoria: query.categoria };
}

router.get('/', async (req, res) => {
  const { ano, categoria, erro } = lerFiltros(req.query);
  if (erro) {
    return res.status(400).json({ erro });
  }

  const relatorios = await dados.buscarRelatoriosPublicados({ ano, categoria });
  res.json(relatorios.map(formatarRelatorio));
});

function nomeSeguro(valor) {
  return String(valor)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'relatorio';
}

router.get('/:id/arquivo', async (req, res) => {
  const id = lerId(req.params.id);
  if (id === null) return res.status(404).json({ erro: 'Relatório não encontrado' });

  const relatorio = await dados.buscarRelatorioPublicadoArquivo(id);
  if (!relatorio || path.basename(relatorio.arquivo_url) !== relatorio.arquivo_url) {
    return res.status(404).json({ erro: 'Relatório não encontrado' });
  }

  const caminho = path.join(uploadsDir, relatorio.arquivo_url);
  let arquivo;
  try {
    arquivo = await fs.readFile(caminho);
  } catch (erro) {
    if (erro.code === 'ENOENT' || erro.code === 'EISDIR') {
      return res.status(404).json({ erro: 'Relatório não encontrado' });
    }
    throw erro;
  }

  const nome = `${nomeSeguro(relatorio.edicao)}-${nomeSeguro(relatorio.titulo)}.pdf`;
  res.set('Content-Type', 'application/pdf');
  res.set('Content-Disposition', `attachment; filename="${nome}"`);
  return res.send(arquivo);
});

module.exports = router;
