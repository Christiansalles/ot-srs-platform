const { rateLimit } = require('express-rate-limit');

const ERRO_LIMITE_LOGIN = 'Muitas tentativas de login. Aguarde alguns minutos e tente de novo.';

function lerInteiroPositivo(nome, padrao) {
  const valor = process.env[nome];
  if (valor === undefined || valor === '') return padrao;

  const numero = Number(valor);
  if (!/^\d+$/.test(valor) || !Number.isSafeInteger(numero) || numero <= 0) {
    throw new Error(`${nome} deve ser um inteiro positivo`);
  }
  return numero;
}

const limitarLogin = rateLimit({
  windowMs: lerInteiroPositivo('LOGIN_JANELA_MINUTOS', 15) * 60 * 1000,
  limit: lerInteiroPositivo('LOGIN_MAX_TENTATIVAS', 5),
  skipSuccessfulRequests: true,
  // Apenas 400 e 401 são tentativas erradas; falhas internas e bloqueios não entram na conta.
  requestWasSuccessful: (_req, res) => res.statusCode !== 400 && res.statusCode !== 401,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ erro: ERRO_LIMITE_LOGIN }),
});

module.exports = limitarLogin;
