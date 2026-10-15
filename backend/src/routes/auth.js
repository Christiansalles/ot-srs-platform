const { Router } = require('express');
const {
  validarCredenciais,
  ERRO_CREDENCIAIS,
} = require('../services/auth');
const autenticar = require('../middlewares/autenticar');

const router = Router();

router.post('/login', async (req, res) => {
  const { email, senha } = req.body || {};
  if (typeof email !== 'string' || !email.trim()
      || typeof senha !== 'string' || !senha) {
    return res.status(400).json({ erro: 'E-mail e senha são obrigatórios' });
  }

  const resultado = await validarCredenciais(email.trim().toLowerCase(), senha);
  if (!resultado) {
    return res.status(401).json({ erro: ERRO_CREDENCIAIS });
  }

  return res.status(200).json(resultado);
});

router.get('/me', autenticar, (req, res) => res.status(200).json(req.usuario));

module.exports = router;
