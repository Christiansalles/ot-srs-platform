const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { gerarHash } = require('../src/services/senha');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true });

const prisma = new PrismaClient();
const dadosPath = path.join(__dirname, 'dados');
const relatoriosPath = path.join(dadosPath, 'relatorios');
const uploadsPath = path.resolve(process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads'));

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

async function carregarRelatorios(usuario) {
  const arquivoDados = path.join(relatoriosPath, 'relatorios.json');
  const relatorios = JSON.parse(fs.readFileSync(arquivoDados, 'utf8'));
  fs.mkdirSync(uploadsPath, { recursive: true });

  for (const dados of relatorios) {
    const nomeArquivo = path.basename(dados.arquivo);
    if (nomeArquivo !== dados.arquivo) {
      throw new Error(`Nome de arquivo inválido no cadastro do relatório: ${dados.arquivo}`);
    }

    const origem = path.join(relatoriosPath, nomeArquivo);
    const destino = path.join(uploadsPath, nomeArquivo);
    if (!fs.existsSync(origem) || !fs.statSync(origem).isFile()) {
      throw new Error(`PDF não encontrado para o relatório ${dados.edicao}: ${origem}`);
    }

    fs.copyFileSync(origem, destino);
    const tamanhoKb = Math.ceil(fs.statSync(destino).size / 1024);
    const relatorio = {
      id_usuario: usuario.id_usuario,
      titulo: dados.titulo,
      edicao: dados.edicao,
      categoria: dados.categoria,
      data_publicacao: new Date(`${dados.data_publicacao}T00:00:00.000Z`),
      descricao: dados.descricao,
      arquivo_url: nomeArquivo,
      tamanho_kb: tamanhoKb,
      status: 'publicado',
    };
    const existente = await prisma.relatorio.findFirst({ where: { edicao: dados.edicao } });
    if (existente) {
      await prisma.relatorio.update({
        where: { id_relatorio: existente.id_relatorio },
        data: relatorio,
      });
    } else {
      await prisma.relatorio.create({ data: relatorio });
    }
    console.log(`Carga do relatório ${dados.edicao} executada com sucesso.`);
  }
}

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminSenha = process.env.ADMIN_SENHA;
  if (!adminEmail || !adminSenha?.trim()) {
    throw new Error('ADMIN_EMAIL e ADMIN_SENHA precisam estar configuradas para executar o seed.');
  }
  if (adminEmail === 'carga-inicial@observatorio.local') {
    throw new Error('ADMIN_EMAIL não pode usar o e-mail reservado para Carga inicial.');
  }

  const adminSenhaHash = await gerarHash(adminSenha);
  await prisma.usuario.upsert({
    where: { email: adminEmail },
    update: {
      nome: 'Administrador',
      senha_hash: adminSenhaHash,
      ativo: true,
    },
    create: {
      nome: 'Administrador',
      email: adminEmail,
      senha_hash: adminSenhaHash,
      ativo: true,
    },
  });

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

  await carregarRelatorios(usuario);
}

main()
  .catch((erro) => {
    console.error('Erro ao executar o seed:', erro);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
