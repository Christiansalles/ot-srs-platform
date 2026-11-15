jest.mock('../src/db', () => ({
  indicador: { findMany: jest.fn() },
  medicao: { aggregate: jest.fn() },
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
        atualizado_em: new Date('2026-11-03T14:20:00.000Z'),
        periodo: { ano: 2025, semestre: 2 },
        usuario: { nome: 'Editora' },
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
        atualizado_em: new Date('2026-10-21T09:00:00.000Z'),
        periodo: { ano: 2025, semestre: 1 },
        usuario: { nome: 'Administrador' },
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
        medicoes: { include: { periodo: true, usuario: { select: { nome: true } } } },
      },
    });
    expect(indicadores).toEqual([
      {
        id: 1,
        nome: 'Árvores',
        unidade: 'unidades',
        descricao: 'Quantidade',
        setor: { id: 1, nome: 'Meio ambiente' },
        medicoes: [{
          id: 11,
          ano: 2025,
          semestre: 1,
          valor: 8,
          status: 'publicado',
          atualizado_em: new Date('2026-10-21T09:00:00.000Z'),
          lancado_por: 'Administrador',
        }],
      },
      {
        id: 2,
        nome: 'Zebra',
        unidade: 'unidades',
        descricao: null,
        setor: { id: 2, nome: 'Outros' },
        medicoes: [{
          id: 22,
          ano: 2025,
          semestre: 2,
          valor: 10.5,
          status: 'rascunho',
          atualizado_em: new Date('2026-11-03T14:20:00.000Z'),
          lancado_por: 'Editora',
        }],
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
        medicoes: { where: { status: 'publicado' }, include: { periodo: true, usuario: { select: { nome: true } } } },
      },
    });
  });
});

describe('buscarAtualizacao', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sem filtros, pega o maior atualizado_em só entre as publicadas', async () => {
    const data = new Date('2026-11-03T14:20:00.000Z');
    prisma.medicao.aggregate.mockResolvedValue({ _max: { atualizado_em: data } });

    await expect(dados.buscarAtualizacao()).resolves.toEqual(data);
    expect(prisma.medicao.aggregate).toHaveBeenCalledWith({
      where: { status: 'publicado' },
      _max: { atualizado_em: true },
    });
  });

  it('aplica setor, ano e semestre na consulta', async () => {
    prisma.medicao.aggregate.mockResolvedValue({ _max: { atualizado_em: null } });

    await dados.buscarAtualizacao({ setorId: 1, ano: 2025, semestre: 2 });

    expect(prisma.medicao.aggregate).toHaveBeenCalledWith({
      where: {
        status: 'publicado',
        indicador: { is: { id_setor: 1 } },
        periodo: { is: { ano: 2025, semestre: 2 } },
      },
      _max: { atualizado_em: true },
    });
  });

  it('só com ano, filtra o ano inteiro', async () => {
    prisma.medicao.aggregate.mockResolvedValue({ _max: { atualizado_em: null } });

    await dados.buscarAtualizacao({ ano: 2025 });

    expect(prisma.medicao.aggregate).toHaveBeenCalledWith({
      where: { status: 'publicado', periodo: { is: { ano: 2025 } } },
      _max: { atualizado_em: true },
    });
  });

  it('sem medição publicada nos filtros, devolve null', async () => {
    prisma.medicao.aggregate.mockResolvedValue({ _max: { atualizado_em: null } });

    await expect(dados.buscarAtualizacao({ setorId: 999 })).resolves.toBeNull();
  });
});
