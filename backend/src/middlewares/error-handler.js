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
    : err.type === 'entity.parse.failed'
      ? 'JSON inválido'
      : err.message || 'Requisição inválida';

  return res.status(status).json({ erro: message });
}

module.exports = errorHandler;
