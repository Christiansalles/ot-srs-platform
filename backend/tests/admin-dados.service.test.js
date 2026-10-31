jest.mock('../src/db', () => ({
  indicador: { findMany: jest.fn() },
}));

const prisma = require('../src/db');
const dados = require('../src/services/dados');

const resultadoPrisma = [
  {
    id_indicador: 2,
    nome: 'Zebra',
    unidade: 'unidades',
    descricao: null,
    setor: { id_setor: 2, nome: 'Outros' },
    medicoes: [
      {
        id_medicao: 22,
        valor: '10.50',
        status: 'rascunho',
        periodo: { ano: 2025, semestre: 2 },
      },
    ],
  },
  {
    id_indicador: 1,
    nome: 'Árvores',
    unidade: 'unidades',
    descricao: 'Quantidade',
    setor: { id_setor: 1, nome: 'Meio ambiente' },
    medicoes: [
      {
        id_medicao: 11,
        valor: '8.00',
        status: 'publicado',
        periodo: { ano: 2025, semestre: 1 },
      },
    ],
  },
];

describe('buscarIndicadoresAdmin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.indicador.findMany.mockResolvedValue(resultadoPrisma);
  });

  it('busca todos os indicadores com todas as medições e mapeia os campos do contrato', async () => {
    const indicadores = await dados.buscarIndicadoresAdmin();

    expect(prisma.indicador.findMany).toHaveBeenCalledWith({
      where: {},
      include: {
        setor: true,
        medicoes: { include: { periodo: true } },
      },
    });
    expect(indicadores).toEqual([
      {
        id: 1,
        nome: 'Árvores',
        unidade: 'unidades',
        descricao: 'Quantidade',
        setor: { id: 1, nome: 'Meio ambiente' },
        medicoes: [{ id: 11, ano: 2025, semestre: 1, valor: 8, status: 'publicado' }],
      },
      {
        id: 2,
        nome: 'Zebra',
        unidade: 'unidades',
        descricao: null,
        setor: { id: 2, nome: 'Outros' },
        medicoes: [{ id: 22, ano: 2025, semestre: 2, valor: 10.5, status: 'rascunho' }],
      },
    ]);
  });

  it('aplica filtros de setor e status, excluindo indicadores sem medição no status', async () => {
    await dados.buscarIndicadoresAdmin({ setorId: 1, status: 'publicado' });

    expect(prisma.indicador.findMany).toHaveBeenCalledWith({
      where: {
        id_setor: 1,
        medicoes: { some: { status: 'publicado' } },
      },
      include: {
        setor: true,
        medicoes: { where: { status: 'publicado' }, include: { periodo: true } },
      },
    });
  });
});
