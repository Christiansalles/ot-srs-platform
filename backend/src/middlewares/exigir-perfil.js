const ERRO_PERFIL = 'Seu perfil não pode publicar conteúdo';

// Vem depois do `autenticar`, que lê o usuário do banco a cada requisição:
// vale o perfil atual do banco, não o que existia quando o token foi emitido.
function exigirPerfil(...perfis) {
  return (req, res, next) => {
    if (!req.usuario || !perfis.includes(req.usuario.perfil)) {
      return res.status(403).json({ erro: ERRO_PERFIL });
    }
    return next();
  };
}

module.exports = exigirPerfil;
module.exports.ERRO_PERFIL = ERRO_PERFIL;
