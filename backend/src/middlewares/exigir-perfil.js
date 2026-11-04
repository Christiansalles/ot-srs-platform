const ERRO_PERFIL = 'Seu perfil não pode publicar conteúdo';

// Vem depois do `autenticar`, que lê o usuário do banco a cada requisição:
// vale o perfil atual do banco, não o que existia quando o token foi emitido.
// O último argumento pode ser `{ mensagem }`, para rotas cujo 403 não é sobre publicar.
function exigirPerfil(...argumentos) {
  const opcoes = typeof argumentos.at(-1) === 'object' ? argumentos.pop() : {};
  const perfis = argumentos;
  const mensagem = opcoes.mensagem || ERRO_PERFIL;

  return (req, res, next) => {
    if (!req.usuario || !perfis.includes(req.usuario.perfil)) {
      return res.status(403).json({ erro: mensagem });
    }
    return next();
  };
}

module.exports = exigirPerfil;
module.exports.ERRO_PERFIL = ERRO_PERFIL;
