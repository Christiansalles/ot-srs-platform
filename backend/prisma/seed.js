const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const dadosPath = path.join(__dirname, 'dados');

function gerarSenhaHash() {
  const senha = crypto.randomBytes(32).toString('hex');
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(senha, salt, 64).toString('hex');

  return `${salt}:${hash}`;
}

function setoresDoArquivo(dados, arquivo) {
  if (dados.setor) {
    return [{ setor: dados.setor, indicadores: dados.indicadores }];
  }

  if (Array.isArray(dados.setores)) {
    return dados.setores.map((setor) => ({
      setor,
      indicadores: setor.indicadores || (dados.indicador
        ? [{ ...dados.indicador, medicoes: setor.medicoes }]
        : undefined),
    }));
  }

  throw new Error(
    `Formato inválido em ${arquivo}: esperado "setor" ou "setores" com seus indicadores.`
  );
}

async function carregarSetor(setorDados, usuario) {
  const setor = await prisma.setor.upsert({
    where: { nome: setorDados.setor.nome },
    update: { descricao: setorDados.setor.descricao },
    create: {
      nome: setorDados.setor.nome,
      descricao: setorDados.setor.descricao,
    },
  });

  for (const indicadorDados of setorDados.indicadores) {
    const indicadorExistente = await prisma.indicador.findFirst({
      where: {
        id_setor: setor.id_setor,
        nome: indicadorDados.nome,
      },
    });

    const indicador = indicadorExistente
      ? await prisma.indicador.update({
          where: { id_indicador: indicadorExistente.id_indicador },
          data: {
            descricao: indicadorDados.descricao,
            unidade: indicadorDados.unidade,
          },
        })
      : await prisma.indicador.create({
          data: {
            id_setor: setor.id_setor,
            nome: indicadorDados.nome,
            descricao: indicadorDados.descricao,
            unidade: indicadorDados.unidade,
          },
        });

    for (const medicaoDados of indicadorDados.medicoes) {
      const periodo = await prisma.periodo.upsert({
        where: {
          ano_semestre: {
            ano: medicaoDados.periodo.ano,
            semestre: medicaoDados.periodo.semestre,
          },
        },
        update: {},
        create: {
          ano: medicaoDados.periodo.ano,
          semestre: medicaoDados.periodo.semestre,
        },
      });

      await prisma.medicao.upsert({
        where: {
          id_indicador_id_periodo: {
            id_indicador: indicador.id_indicador,
            id_periodo: periodo.id_periodo,
          },
        },
        update: {
          id_usuario: usuario.id_usuario,
          valor: medicaoDados.valor,
          status: 'publicado',
        },
        create: {
          id_indicador: indicador.id_indicador,
          id_periodo: periodo.id_periodo,
          id_usuario: usuario.id_usuario,
          valor: medicaoDados.valor,
          status: 'publicado',
        },
      });
    }
  }
}

async function main() {
  const usuario = await prisma.usuario.upsert({
    where: { email: 'carga-inicial@observatorio.local' },
    update: {
      nome: 'Carga inicial',
      ativo: false,
    },
    create: {
      nome: 'Carga inicial',
      email: 'carga-inicial@observatorio.local',
      senha_hash: gerarSenhaHash(),
      ativo: false,
    },
  });

  const arquivos = fs
    .readdirSync(dadosPath)
    .filter((arquivo) => path.extname(arquivo).toLowerCase() === '.json')
    .sort();

  for (const arquivo of arquivos) {
    const caminho = path.join(dadosPath, arquivo);
    const dados = JSON.parse(fs.readFileSync(caminho, 'utf8'));

    for (const setorDados of setoresDoArquivo(dados, arquivo)) {
      await carregarSetor(setorDados, usuario);
      console.log(`Carga do setor ${setorDados.setor.nome} executada com sucesso.`);
    }
  }
}

main()
  .catch((erro) => {
    console.error('Erro ao executar o seed:', erro);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
