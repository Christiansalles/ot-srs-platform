const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const dadosPath = path.join(__dirname, 'dados', 'hospedagem.json');
const dados = JSON.parse(fs.readFileSync(dadosPath, 'utf8'));

function gerarSenhaHash() {
  const senha = crypto.randomBytes(32).toString('hex');
  const salt = crypto.randomBytes(16).toString('hex');

  const hash = crypto.scryptSync(senha, salt, 64).toString('hex');

  return `${salt}:${hash}`;
}

async function main() {
  const usuario = await prisma.usuario.upsert({
    where: {
      email: 'carga-inicial@observatorio.local',
    },
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

  const setor = await prisma.setor.upsert({
    where: {
      nome: dados.setor.nome,
    },
    update: {
      descricao: dados.setor.descricao,
    },
    create: {
      nome: dados.setor.nome,
      descricao: dados.setor.descricao,
    },
  });

  for (const indicadorDados of dados.indicadores) {
    const indicadorExistente = await prisma.indicador.findFirst({
      where: {
        id_setor: setor.id_setor,
        nome: indicadorDados.nome,
      },
    });

    const indicador = indicadorExistente
      ? await prisma.indicador.update({
          where: {
            id_indicador: indicadorExistente.id_indicador,
          },
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

  console.log('Seed da hospedagem executado com sucesso.');
}

main()
  .catch((erro) => {
    console.error('Erro ao executar o seed:', erro);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
