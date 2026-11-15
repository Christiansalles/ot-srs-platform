// O jsdom não calcula layout, então a regra é conferida lendo o CSS do AppLayout
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const appCss = readFileSync(join(process.cwd(), 'src', 'App.css'), 'utf-8').replace(/\/\*[\s\S]*?\*\//g, '');

function regrasDe(seletor) {
  const escapado = seletor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return [...appCss.matchAll(new RegExp(`(?:^|[},])\\s*${escapado}\\s*\\{([^}]*)\\}`, 'g'))].map(([, corpo]) => corpo);
}

describe('layout das páginas públicas', () => {
  it('mantém o rodapé abaixo da primeira tela enquanto a página carrega', () => {
    const declaracoes = regrasDe('.page-shell').join(';');

    expect(declaracoes).toMatch(/min-height:\s*100vh/);
  });
});
