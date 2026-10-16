const { buscarUsuarioAutenticado, ERRO_TOKEN } = require('../services/auth');

async function autenticar(req, res, next) {
  const autorizacao = req.get('Authorization') || '';
  const correspondencia = autorizacao.match(/^Bearer\s+(\S+)$/i);
  if (!correspondencia) {
    return res.status(401).json({ erro: ERRO_TOKEN });
  }

  const usuario = await buscarUsuarioAutenticado(correspondencia[1]);
  if (!usuario) {
    return res.status(401).json({ erro: ERRO_TOKEN });
  }

  req.usuario = usuario;
  return next();
}

module.exports = autenticar;
