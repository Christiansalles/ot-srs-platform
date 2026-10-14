const { Router } = require('express');
const { autenticar, ERRO_CREDENCIAIS } = require('../services/auth');

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

module.exports = router;
