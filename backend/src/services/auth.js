const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');
const prisma = require('../db');

const ERRO_CREDENCIAIS = 'E-mail ou senha inválidos';
const ERRO_TOKEN = 'Token inválido ou expirado';
const DURACAO_TOKEN = '8h';

async function verificarSenha(senha, senhaHash) {
  if (typeof senhaHash !== 'string') return false;

  const separador = senhaHash.indexOf(':');
  if (separador <= 0 || separador === senhaHash.length - 1) return false;

  const salt = senhaHash.slice(0, separador);
  const hashArmazenado = senhaHash.slice(separador + 1);
  if (!/^[a-f\d]+$/i.test(salt) || !/^[a-f\d]+$/i.test(hashArmazenado)) return false;

  const hashEsperado = Buffer.from(hashArmazenado, 'hex');
  const hashCalculado = await new Promise((resolve, reject) => {
    crypto.scrypt(senha, salt, hashEsperado.length, (erro, resultado) => {
      if (erro) reject(erro);
      else resolve(resultado);
    });
  });

  return hashCalculado.length === hashEsperado.length
    && crypto.timingSafeEqual(hashCalculado, hashEsperado);
}

function criarToken(usuario) {
  const segredo = process.env.JWT_SECRET;
  if (!segredo) {
    throw new Error('JWT_SECRET não está configurada');
  }

  return jwt.sign(
    { email: usuario.email },
    segredo,
    { algorithm: 'HS256', subject: String(usuario.id_usuario), expiresIn: DURACAO_TOKEN },
  );
}

function lerToken(token) {
  const segredo = process.env.JWT_SECRET;
  if (!segredo || typeof token !== 'string') return null;

  try {
    const dadosToken = jwt.verify(token, segredo, { algorithms: ['HS256'] });
    if (typeof dadosToken.sub !== 'string' || !/^\d+$/.test(dadosToken.sub)
        || !Number.isSafeInteger(Number(dadosToken.sub))) {
      return null;
    }
    return { id_usuario: Number(dadosToken.sub) };
  } catch {
    return null;
  }
}

async function validarCredenciais(email, senha) {
  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario || !usuario.ativo) return null;

  const senhaValida = await verificarSenha(senha, usuario.senha_hash);
  if (!senhaValida) return null;

  return {
    token: criarToken(usuario),
    usuario: {
      id: usuario.id_usuario,
      nome: usuario.nome,
      email: usuario.email,
    },
  };
}

async function buscarUsuarioAutenticado(token) {
  const identidade = lerToken(token);
  if (!identidade) return null;

  const usuario = await prisma.usuario.findUnique({
    where: { id_usuario: identidade.id_usuario },
  });
  if (!usuario || !usuario.ativo) return null;

  return {
    id: usuario.id_usuario,
    nome: usuario.nome,
    email: usuario.email,
  };
}

module.exports = {
  validarCredenciais,
  buscarUsuarioAutenticado,
  criarToken,
  ERRO_CREDENCIAIS,
  ERRO_TOKEN,
};
