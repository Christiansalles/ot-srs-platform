const { Router } = require('express');
const {
  autenticar,
  buscarUsuarioAutenticado,
  ERRO_CREDENCIAIS,
  ERRO_TOKEN,
} = require('../services/auth');

const router = Router();

router.post('/login', async (req, res) => {
  const { email, senha } = req.body || {};
  if (typeof email !== 'string' || !email.trim()
      || typeof senha !== 'string' || !senha) {
    return res.status(400).json({ erro: 'E-mail e senha são obrigatórios' });
  }

  const resultado = await autenticar(email.trim().toLowerCase(), senha);
  if (!resultado) {
    return res.status(401).json({ erro: ERRO_CREDENCIAIS });
  }

  return res.status(200).json(resultado);
});

router.get('/me', async (req, res) => {
  const autorizacao = req.get('Authorization') || '';
  const correspondencia = autorizacao.match(/^Bearer\s+(\S+)$/i);
  if (!correspondencia) {
    return res.status(401).json({ erro: ERRO_TOKEN });
  }

  const usuario = await buscarUsuarioAutenticado(correspondencia[1]);
  if (!usuario) {
    return res.status(401).json({ erro: ERRO_TOKEN });
  }

  return res.status(200).json({ usuario });
});

module.exports = router;
