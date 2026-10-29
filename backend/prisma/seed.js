const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { gerarHash } = require('../src/services/senha');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true });

const prisma = new PrismaClient();
const dadosPath = path.join(__dirname, 'dados');

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

function lerUsuarioDesenvolvimento(prefixo, nome, perfil) {
  const email = process.env[`${prefixo}_EMAIL`]?.trim().toLowerCase();
  const senha = process.env[`${prefixo}_SENHA`];
  if (!email || !senha?.trim()) {
    throw new Error(`${prefixo}_EMAIL e ${prefixo}_SENHA precisam estar configuradas para executar o seed.`);
  }
  if (email === 'carga-inicial@observatorio.local') {
    throw new Error(`${prefixo}_EMAIL não pode usar o e-mail reservado para Carga inicial.`);
  }

  return { nome, email, senha, perfil };
}

async function carregarUsuarioDesenvolvimento({ nome, email, senha, perfil }) {
  const senhaHash = await gerarHash(senha);
  await prisma.usuario.upsert({
    where: { email },
    update: {
      nome,
      senha_hash: senhaHash,
      ativo: true,
      perfil,
    },
    create: {
      nome,
      email,
      senha_hash: senhaHash,
      ativo: true,
      perfil,
    },
  });
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
  const admin = lerUsuarioDesenvolvimento('ADMIN', 'Administrador', 'administrador');
  const editor = lerUsuarioDesenvolvimento('EDITOR', 'Editor', 'editor');
  if (admin.email === editor.email) {
    throw new Error('ADMIN_EMAIL e EDITOR_EMAIL precisam ser e-mails diferentes.');
  }

  await carregarUsuarioDesenvolvimento(admin);
  await carregarUsuarioDesenvolvimento(editor);

  const usuario = await prisma.usuario.upsert({
    where: { email: 'carga-inicial@observatorio.local' },
    update: {
      nome: 'Carga inicial',
      ativo: false,
    },
    create: {
      nome: 'Carga inicial',
      email: 'carga-inicial@observatorio.local',
      senha_hash: await gerarHash(crypto.randomBytes(32).toString('hex')),
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
