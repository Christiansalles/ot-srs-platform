const { Router } = require('express');
const autenticar = require('../middlewares/autenticar');
const exigirPerfil = require('../middlewares/exigir-perfil');
const { ERRO_NAO_ENCONTRADO, lerId } = require('../services/status');
const {
  ERROS,
  lerCampos,
  listarUsuarios,
  criarUsuario,
  atualizarUsuario,
} = require('../services/usuarios');

const router = Router();

// As três rotas são só do administrador. Não existe DELETE: para tirar o acesso, desative.
router.use(autenticar, exigirPerfil('administrador', { mensagem: ERROS.perfilProibido }));

router.get('/', async (req, res) => {
  res.status(200).json(await listarUsuarios());
});

router.post('/', async (req, res) => {
  const { dados, erro } = lerCampos(req.body, ['nome', 'email', 'senha', 'perfil']);
  if (erro) return res.status(400).json({ erro });

  // `ativo` não entra no cadastro: todo usuário novo nasce ativo.
  delete dados.ativo;
  const usuario = await criarUsuario(dados);
  if (usuario.emailRepetido) return res.status(409).json({ erro: ERROS.emailRepetido });
  return res.status(201).json(usuario);
});

router.patch('/:id', async (req, res) => {
  const id = lerId(req.params.id);
  if (!id) return res.status(404).json({ erro: ERRO_NAO_ENCONTRADO });

  const { dados, erro } = lerCampos(req.body, []);
  if (erro) return res.status(400).json({ erro });

  const usuario = await atualizarUsuario(id, dados, req.usuario.id);
  if (usuario.proprioUsuario) return res.status(409).json({ erro: ERROS.proprioUsuario });
  if (usuario.naoEncontrado) return res.status(404).json({ erro: ERRO_NAO_ENCONTRADO });
  if (usuario.emailRepetido) return res.status(409).json({ erro: ERROS.emailRepetido });
  return res.status(200).json(usuario);
});

module.exports = router;
