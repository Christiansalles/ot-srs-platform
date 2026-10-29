// Validação de filtros de query string compartilhada pelas rotas
// (indicadores, painel e relatórios).

// `?setor=` é opcional. Quando vem, precisa ser um inteiro positivo;
// qualquer outra coisa (abc, 1.5, -1, vazio, repetido) é 400.
function lerSetor(query) {
  if (query.setor === undefined) {
    return { setorId: undefined };
  }
  if (typeof query.setor !== 'string' || !/^[1-9]\d*$/.test(query.setor)) {
    return { erro: 'setor deve ser um número inteiro positivo' };
  }
  return { setorId: Number(query.setor) };
}

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

module.exports = { lerSetor, lerAno };
