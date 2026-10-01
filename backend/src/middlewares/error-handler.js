// Mensagens em português para os erros que o próprio Express/body-parser gera.
const MENSAGENS_POR_TIPO = {
  'entity.parse.failed': 'JSON inválido',
  'entity.too.large': 'Corpo da requisição muito grande',
  'encoding.unsupported': 'Codificação do corpo não suportada',
  'charset.unsupported': 'Charset do corpo não suportado',
};

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const errorStatus = err.status || err.statusCode;
  const status = Number.isInteger(errorStatus) && errorStatus >= 400 && errorStatus <= 599
    ? errorStatus
    : 500;

  const message = status >= 500
    ? 'Erro interno do servidor'
    : MENSAGENS_POR_TIPO[err.type] || err.message || 'Requisição inválida';

  return res.status(status).json({ erro: message });
}

module.exports = errorHandler;
