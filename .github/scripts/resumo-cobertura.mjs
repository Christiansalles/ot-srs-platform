// Escreve em Markdown o total de um coverage-summary.json (Jest ou Vitest),
// para o "Summary" da execução do CI.
//
// Uso: node .github/scripts/resumo-cobertura.mjs "Backend (Jest)" backend/coverage/coverage-summary.json

import { existsSync, readFileSync } from 'node:fs';

const [titulo, arquivo] = process.argv.slice(2);
if (!titulo || !arquivo) {
  console.error('Uso: node resumo-cobertura.mjs <título> <coverage-summary.json>');
  process.exit(1);
}

if (!existsSync(arquivo)) {
  console.log(`### Cobertura: ${titulo}\n\nO arquivo \`${arquivo}\` não foi gerado (os testes falharam antes do fim?).\n`);
  process.exit(0);
}

const { total } = JSON.parse(readFileSync(arquivo, 'utf8'));
const metricas = [
  ['Linhas', 'lines'],
  ['Instruções', 'statements'],
  ['Ramos', 'branches'],
  ['Funções', 'functions'],
];

const porcentagem = (valor) => `${valor.toFixed(2).replace('.', ',')}%`;

const linhas = [
  `### Cobertura: ${titulo}`,
  '',
  '| Métrica | Cobertura | Cobertos / total |',
  '|---|---|---|',
  ...metricas.map(([nome, chave]) => {
    const { pct, covered, total: soma } = total[chave];
    return `| ${nome} | ${porcentagem(pct)} | ${covered} / ${soma} |`;
  }),
  '',
  'O relatório completo (tabela por arquivo e HTML) está nos artefatos desta execução.',
  '',
];

console.log(linhas.join('\n'));
