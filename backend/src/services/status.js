// Regras comuns das rotas PATCH .../status de medição e relatório.

const STATUS_VALIDOS = ['rascunho', 'publicado'];
const ERRO_STATUS = 'Status inválido';
const ERRO_NAO_ENCONTRADO = 'Recurso não encontrado';

// `:id` precisa ser inteiro positivo; qualquer outra coisa é tratada como
// id inexistente (404), sem consultar o banco.
function lerId(parametro) {
  if (!/^[1-9]\d*$/.test(parametro)) return null;
  const id = Number(parametro);
  return Number.isSafeInteger(id) && id <= 2147483647 ? id : null;
}

// Corpo: { "status": "publicado" | "rascunho" }. Sem corpo, outro valor ou
// outro tipo é 400.
function lerStatus(corpo) {
  const status = corpo?.status;
  return STATUS_VALIDOS.includes(status) ? status : null;
}

module.exports = {
  STATUS_VALIDOS,
  ERRO_STATUS,
  ERRO_NAO_ENCONTRADO,
  lerId,
  lerStatus,
};
