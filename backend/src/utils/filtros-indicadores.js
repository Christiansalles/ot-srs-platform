function lerSetor(query) {
  if (query.setor === undefined) {
    return { setorId: undefined };
  }
  if (typeof query.setor !== 'string' || !/^[1-9]\d*$/.test(query.setor)) {
    return { erro: 'setor deve ser um número inteiro positivo' };
  }
  return { setorId: Number(query.setor) };
}

module.exports = { lerSetor };
