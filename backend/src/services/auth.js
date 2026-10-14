const crypto = require('node:crypto');
const { promisify } = require('node:util');
const prisma = require('../db');

const scrypt = promisify(crypto.scrypt);
const ERRO_CREDENCIAIS = 'E-mail ou senha inválidos';
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

module.exports = { autenticar, ERRO_CREDENCIAIS };
