// Tira os prints de evidência de um PR com o Chrome instalado na máquina.
//
// Uso (dentro de frontend/, depois de `npm i --no-save playwright-core`):
//   node ../.claude/skills/evidencias-pr/capturar.mjs --pr 215 --rotas /,/relatorios --larguras 375,1280
//
// Opções: --base (padrão http://localhost:5173), --saida (padrão ../docs/evidencias/pr-<N>),
// --altura (padrão 900). CHROME_PATH sobrescreve o caminho do Chrome.

import { createRequire } from 'node:module';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

// Resolve o playwright-core a partir da pasta onde o comando roda, não da skill.
const require = createRequire(path.join(process.cwd(), 'noop.js'));
let chromium;
try {
  ({ chromium } = require('playwright-core'));
} catch {
  console.error('playwright-core não encontrado. Rode `npm i --no-save playwright-core` nesta pasta.');
  process.exit(1);
}

function lerArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) args[argv[i].replace(/^--/, '')] = argv[i + 1];
  return args;
}

function acharChrome() {
  const candidatos = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ].filter(Boolean);
  return candidatos.find((c) => existsSync(c));
}

// "/" vira "home"; "/indicadores?ano=2024" vira "indicadores-ano-2024".
function nomeDaRota(rota) {
  const nome = rota.replace(/^\/+/, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
  return nome || 'home';
}

const args = lerArgs(process.argv.slice(2));
if (!args.pr && !args.saida) {
  console.error('Informe --pr <número> ou --saida <pasta>.');
  process.exit(1);
}
const base = (args.base || 'http://localhost:5173').replace(/\/$/, '');
const saida = path.resolve(args.saida || `../docs/evidencias/pr-${args.pr}`);
const rotas = (args.rotas || '/').split(',');
const larguras = (args.larguras || '375,1280').split(',').map(Number);
const altura = Number(args.altura || 900);

const executablePath = acharChrome();
if (!executablePath) {
  console.error('Chrome não encontrado. Defina CHROME_PATH.');
  process.exit(1);
}

try {
  await fetch(base);
} catch {
  console.error(`O front não responde em ${base}. Suba o \`npm run dev\` (ou o Compose) antes.`);
  process.exit(1);
}

mkdirSync(saida, { recursive: true });
const browser = await chromium.launch({ executablePath });
const problemas = [];

for (const rota of rotas) {
  for (const largura of larguras) {
    const page = await browser.newPage({ viewport: { width: largura, height: altura } });
    page.on('console', (msg) => {
      if (msg.type() === 'error') problemas.push(`${rota} @ ${largura}px: console: ${msg.text()}`);
    });
    page.on('pageerror', (erro) => problemas.push(`${rota} @ ${largura}px: ${erro.message}`));
    await page.goto(base + rota, { waitUntil: 'networkidle' });
    const transborda = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    if (transborda) problemas.push(`${rota} @ ${largura}px: a página rola na horizontal`);
    const arquivo = path.join(saida, `${nomeDaRota(rota)}-${largura}.png`);
    await page.screenshot({ path: arquivo, fullPage: true });
    console.log(`ok  ${path.relative(process.cwd(), arquivo)}`);
    await page.close();
  }
}

await browser.close();
if (problemas.length) {
  console.log('\nProblemas encontrados:');
  problemas.forEach((p) => console.log(`- ${p}`));
  process.exitCode = 2;
}
