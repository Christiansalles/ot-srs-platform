// Gera, a partir dos coverage-summary.json de uma pasta de extrato, os prints do
// relatório HTML e o PDF de uma página com os dois resumos (Jest e Vitest).
//
// Uso, dentro de frontend/, depois de rodar `npm run test:cobertura` no backend e no
// frontend, copiar os resumos para a pasta e rodar `npm i --no-save playwright-core`:
//
//   node ../docs/testes/cobertura/gerar-extrato.mjs --pasta ../docs/testes/cobertura/m7 \
//     --milestone 7 --sha <sha> --ci <url da execução> --data 15/11/2026 \
//     --testes-back 303 --testes-front 385 --e2e "114 passaram, 14 pulados"
//
// Usa o Chrome da máquina (CHROME_PATH sobrescreve o caminho).

import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

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
  return [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ]
    .filter(Boolean)
    .find((c) => existsSync(c));
}

const args = lerArgs(process.argv.slice(2));
for (const obrigatorio of ['pasta', 'milestone', 'sha', 'ci', 'data']) {
  if (!args[obrigatorio]) {
    console.error(`Informe --${obrigatorio}.`);
    process.exit(1);
  }
}

const pasta = path.resolve(args.pasta);
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const relatoriosHtml = {
  backend: path.join(raiz, 'backend/coverage/lcov-report/index.html'),
  frontend: path.join(raiz, 'frontend/coverage/index.html'),
};

const metricas = [
  ['Linhas', 'lines'],
  ['Instruções', 'statements'],
  ['Ramos', 'branches'],
  ['Funções', 'functions'],
];
const porcentagem = (valor) => `${valor.toFixed(2).replace('.', ',')}%`;
const milhar = (valor) => valor.toLocaleString('pt-BR');

function tabela(titulo, parte, testes) {
  const { total } = JSON.parse(readFileSync(path.join(pasta, `${parte}-summary.json`), 'utf8'));
  const linhas = metricas
    .map(([nome, chave]) => {
      const { pct, covered, total: soma } = total[chave];
      return `<tr><th scope="row">${nome}</th><td class="pct">${porcentagem(pct)}</td><td>${milhar(covered)} / ${milhar(soma)}</td></tr>`;
    })
    .join('');
  return `
    <section>
      <h2>${titulo}</h2>
      <p class="testes">${testes}</p>
      <table>
        <thead><tr><th scope="col">Métrica</th><th scope="col">Cobertura</th><th scope="col">Cobertos / total</th></tr></thead>
        <tbody>${linhas}</tbody>
      </table>
    </section>`;
}

const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Extrato de cobertura, Milestone ${args.milestone}</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  body { font-family: "Segoe UI", Arial, sans-serif; color: #0F172A; margin: 0; font-size: 11pt; }
  header { border-bottom: 3px solid #0A4AAD; padding-bottom: 10px; margin-bottom: 18px; }
  .sobretitulo { color: #0A4AAD; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; font-size: 9pt; margin: 0; }
  h1 { font-size: 20pt; margin: 4px 0 6px; }
  .meta { margin: 0; color: #334155; line-height: 1.6; }
  .meta code { font-size: 9.5pt; background: #F1F5F9; padding: 1px 4px; border-radius: 3px; }
  .meta a { color: #0A4AAD; word-break: break-all; }
  .grade { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
  section { border: 1px solid #E2E8F0; border-radius: 10px; padding: 14px 16px; }
  h2 { font-size: 13pt; margin: 0 0 4px; }
  .testes { margin: 0 0 10px; color: #475569; font-size: 10pt; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 6px 4px; border-bottom: 1px solid #E2E8F0; font-size: 10pt; }
  thead th { color: #64748B; font-weight: 600; font-size: 9pt; }
  td.pct { font-weight: 700; color: #0A4AAD; }
  .e2e { margin-top: 18px; }
  .rodape { margin-top: 18px; color: #64748B; font-size: 9pt; line-height: 1.5; }
</style>
</head>
<body>
  <header>
    <p class="sobretitulo">OT-SRS · Grupo 8 · C317</p>
    <h1>Extrato de cobertura de testes, Milestone ${args.milestone}</h1>
    <p class="meta">
      Commit: <code>${args.sha}</code><br>
      Data da medição: ${args.data}<br>
      Execução do CI: <a href="${args.ci}">${args.ci}</a>
    </p>
  </header>
  <div class="grade">
    ${tabela('Backend (Jest)', 'backend', `${args['testes-back'] ?? '?'} testes, todos passaram`)}
    ${tabela('Frontend (Vitest)', 'frontend', `${args['testes-front'] ?? '?'} testes, todos passaram`)}
  </div>
  ${args.e2e ? `<section class="e2e"><h2>Ponta a ponta (Playwright)</h2><p class="testes">${args.e2e}, na mesma execução de CI do commit (job <code>compose</code>). O E2E não entra na medição de cobertura.</p></section>` : ''}
  <p class="rodape">
    Gerado com <code>npm run test:cobertura</code> em <code>backend/</code> (Jest, provedor babel/istanbul) e em
    <code>frontend/</code> (Vitest com <code>@vitest/coverage-v8</code>). A tabela por arquivo e os prints do relatório HTML
    estão em <code>docs/testes/cobertura/m${args.milestone}/</code> no repositório.
  </p>
</body>
</html>`;

const browser = await chromium.launch({ executablePath: acharChrome() });
try {
  const pagina = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  for (const [parte, arquivo] of Object.entries(relatoriosHtml)) {
    if (!existsSync(arquivo)) {
      console.warn(`Relatório HTML do ${parte} não encontrado em ${arquivo}; print pulado.`);
      continue;
    }
    await pagina.goto(pathToFileURL(arquivo).href);
    const destino = path.join(pasta, `${parte}-html.png`);
    await pagina.screenshot({ path: destino, fullPage: true });
    console.log(`Print salvo: ${destino}`);
  }

  await pagina.setContent(html, { waitUntil: 'load' });
  const pdf = path.join(pasta, `extrato-cobertura-m${args.milestone}.pdf`);
  await pagina.pdf({ path: pdf, format: 'A4', printBackground: true, preferCSSPageSize: true });
  console.log(`PDF salvo: ${pdf}`);
} finally {
  await browser.close();
}
