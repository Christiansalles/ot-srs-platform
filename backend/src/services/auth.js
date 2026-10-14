const crypto = require('node:crypto');
const { promisify } = require('node:util');
const prisma = require('../db');

const scrypt = promisify(crypto.scrypt);
const ERRO_CREDENCIAIS = 'E-mail ou senha inválidos';
const ERRO_TOKEN = 'Token inválido ou expirado';
const DURACAO_TOKEN_SEGUNDOS = 60 * 60;

async function verificarSenha(senha, senhaHash) {
  if (typeof senhaHash !== 'string') return false;

  const separador = senhaHash.indexOf(':');
  if (separador <= 0 || separador === senhaHash.length - 1) return false;

  const salt = senhaHash.slice(0, separador);
  const hashArmazenado = senhaHash.slice(separador + 1);
  if (!/^[a-f\d]+$/i.test(salt) || !/^[a-f\d]+$/i.test(hashArmazenado)) return false;

  const hashEsperado = Buffer.from(hashArmazenado, 'hex');
  const hashCalculado = await scrypt(senha, salt, hashEsperado.length);
  return hashCalculado.length === hashEsperado.length
    && crypto.timingSafeEqual(hashCalculado, hashEsperado);
}

function criarToken(usuario, agora = Math.floor(Date.now() / 1000)) {
  const segredo = process.env.AUTH_TOKEN_SECRET;
  if (!segredo) {
    throw new Error('AUTH_TOKEN_SECRET não está configurada');
  }

  const codificar = (valor) => Buffer.from(JSON.stringify(valor)).toString('base64url');
  const cabecalho = codificar({ alg: 'HS256', typ: 'JWT' });
  const payload = codificar({
    sub: String(usuario.id_usuario),
    email: usuario.email,
    iat: agora,
    exp: agora + DURACAO_TOKEN_SEGUNDOS,
  });
  const conteudo = `${cabecalho}.${payload}`;
  const assinatura = crypto.createHmac('sha256', segredo).update(conteudo).digest('base64url');
  return `${conteudo}.${assinatura}`;
}

function lerToken(token, agora = Math.floor(Date.now() / 1000)) {
  const segredo = process.env.AUTH_TOKEN_SECRET;
  if (!segredo || typeof token !== 'string') return null;

  const partes = token.split('.');
  if (partes.length !== 3) return null;

  const [cabecalho, payload, assinatura] = partes;
  let dadosCabecalho;
  let dadosToken;
  try {
    dadosCabecalho = JSON.parse(Buffer.from(cabecalho, 'base64url').toString('utf8'));
    dadosToken = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }

  if (!dadosCabecalho || typeof dadosCabecalho !== 'object'
      || !dadosToken || typeof dadosToken !== 'object'
      || dadosCabecalho.alg !== 'HS256' || dadosCabecalho.typ !== 'JWT') {
    return null;
  }

  const conteudo = `${cabecalho}.${payload}`;
  const assinaturaEsperada = crypto.createHmac('sha256', segredo).update(conteudo).digest();
  let assinaturaRecebida;
  try {
    assinaturaRecebida = Buffer.from(assinatura, 'base64url');
  } catch {
    return null;
  }
  if (assinaturaRecebida.length !== assinaturaEsperada.length
      || !crypto.timingSafeEqual(assinaturaRecebida, assinaturaEsperada)) {
    return null;
  }

  if (typeof dadosToken.sub !== 'string' || !/^\d+$/.test(dadosToken.sub)
      || !Number.isSafeInteger(Number(dadosToken.sub))
      || !Number.isFinite(dadosToken.exp) || dadosToken.exp <= agora) {
    return null;
  }

  return { id_usuario: Number(dadosToken.sub) };
}

async function autenticar(email, senha) {
  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario || !usuario.ativo) return null;

  const senhaValida = await verificarSenha(senha, usuario.senha_hash);
  if (!senhaValida) return null;

  return {
    token: criarToken(usuario),
    usuario: {
      id_usuario: usuario.id_usuario,
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
    id_usuario: usuario.id_usuario,
    nome: usuario.nome,
    email: usuario.email,
  };
}

module.exports = {
  autenticar,
  buscarUsuarioAutenticado,
  criarToken,
  ERRO_CREDENCIAIS,
  ERRO_TOKEN,
};
