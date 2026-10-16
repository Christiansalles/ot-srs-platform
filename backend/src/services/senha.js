const crypto = require('node:crypto');
const { promisify } = require('node:util');

const scrypt = promisify(crypto.scrypt);
const TAMANHO_HASH = 64;

async function gerarHash(senha) {
  if (typeof senha !== 'string') {
    throw new TypeError('A senha precisa ser uma string');
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await scrypt(senha, salt, TAMANHO_HASH);
  return `${salt}:${hash.toString('hex')}`;
}

async function conferirSenha(senha, senhaHash) {
  if (typeof senha !== 'string' || typeof senhaHash !== 'string') return false;

  const partes = senhaHash.split(':');
  if (partes.length !== 2) return false;

  const [salt, hashHex] = partes;
  if (!/^[a-f\d]{32}$/i.test(salt) || !/^[a-f\d]{128}$/i.test(hashHex)) return false;

  const hashArmazenado = Buffer.from(hashHex, 'hex');
  const hashCalculado = await scrypt(senha, salt, hashArmazenado.length);

  return crypto.timingSafeEqual(hashCalculado, hashArmazenado);
}

module.exports = { gerarHash, conferirSenha };
