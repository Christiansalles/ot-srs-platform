// Acesso ao banco. É a única camada que vai falar com o Prisma.
//
// As consultas dependem do schema da Giovana (#18). Até ele entrar na main,
// estas funções só avisam que ainda não existem; os testes das rotas
// substituem este módulo com jest.mock.
//
// Formato que cada função deve devolver quando for implementada:
//
// buscarSetores()   -> [{ id, nome }]
// buscarPeriodos()  -> [{ id, ano, semestre }]
// buscarIndicadores({ setorId })  (setorId opcional)
//   -> [{ id, nome, unidade, setor: { id, nome },
//         medicoes: [{ ano, semestre, valor, status }] }]
//
// `valor` pode vir como Decimal do Prisma; a conversão para number e o filtro
// por status = 'publicado' ficam em services/indicadores.js.

function naoImplementado(nome) {
  return async () => {
    throw new Error(`${nome}: consulta ainda não implementada, depende do schema (#18)`);
  };
}

module.exports = {
  buscarSetores: naoImplementado('buscarSetores'),
  buscarPeriodos: naoImplementado('buscarPeriodos'),
  buscarIndicadores: naoImplementado('buscarIndicadores'),
};
