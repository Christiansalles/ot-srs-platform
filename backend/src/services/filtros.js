// Validação de filtros de query string compartilhada pelas rotas públicas.

// `?ano=` é opcional. Quando vem, precisa ter 4 dígitos;
// qualquer outra coisa (abc, 25, vazio, repetido) é 400.
function lerAno(query) {
  if (query.ano === undefined) {
    return { ano: undefined };
  }
  if (typeof query.ano !== 'string' || !/^\d{4}$/.test(query.ano)) {
    return { erro: 'ano deve ser um número inteiro de 4 dígitos' };
  }
  return { ano: Number(query.ano) };
}

module.exports = { lerAno };
