import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { entrarComo } from '../ajudantes/sessao.js';

// CT-35 do plano de testes: o axe em cada tela pública e do painel, como administrador.
// Reprova violação `serious` ou `critical` das regras WCAG 2.1 A e AA.

const IMPACTOS_QUE_REPROVAM = ['serious', 'critical'];
const REGRAS_WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

const TELAS = [
  { nome: 'Home', rota: '/', titulo: 'Indicadores do Turismo' },
  { nome: 'Indicadores', rota: '/indicadores', titulo: 'Indicadores turísticos' },
  { nome: 'Dashboard', rota: '/dashboard', titulo: 'Dashboard' },
  { nome: 'Relatórios', rota: '/relatorios', titulo: 'Relatórios' },
  { nome: 'Página 404', rota: '/pagina-que-nao-existe', titulo: 'Página não encontrada' },
  { nome: 'Login', rota: '/admin/login' },
  { nome: 'Tela 6 (painel)', rota: '/admin', titulo: 'Indicadores', administrador: true },
  { nome: 'Tela 7 (cadastro de medição)', rota: '/admin/medicoes/nova', administrador: true },
  { nome: 'Tela 8 (relatórios no painel)', rota: '/admin/relatorios', administrador: true },
  { nome: 'Usuários', rota: '/admin/usuarios', titulo: 'Usuários', administrador: true },
];

// Violações conhecidas, que já têm bug aberto. Cada exceção vale só para a regra, a tela
// e o elemento indicados. Quando o bug for corrigido, apague a exceção: o teste avisa,
// numa anotação, a exceção que não encontrou mais nada.
// O seletor é uma expressão regular sobre o alvo do axe, e não um trecho de texto:
// "th" casaria com qualquer "nth-child" e esconderia um problema novo.
const EXCECOES = [
  {
    bug: '#284', regra: 'color-contrast', rotas: ['/indicadores'], seletor: /^th:nth-child\(\d+\)$/,
    motivo: 'Cabeçalho da tabela de Indicadores a 4,34:1 (achado A-3).',
  },
  {
    bug: '#261', regra: 'color-contrast', rotas: ['/', '/dashboard'],
    seletor: /\.card-indicador__variation(?![\w-])\S* > strong$/,
    motivo: 'Variação dos cards em --color-success, a 3,74:1.',
  },
  {
    bug: '#261', regra: 'aria-hidden-focus', rotas: ['/dashboard'], seletor: /^\.grafico-distribuicao__rosca$/,
    motivo: 'Rosca da distribuição dentro de aria-hidden, mas focável.',
  },
];

function excecaoDo(regra, rota, alvo) {
  return EXCECOES.find((excecao) => excecao.regra === regra
    && excecao.rotas.includes(rota)
    && excecao.seletor.test(alvo));
}

function descrever(violacoes) {
  return violacoes.map(({ id, impact, help, nodes }) => [
    `${id} [${impact}]: ${help}`,
    ...nodes.map((no) => `  - ${no.target.join(' ')}`),
  ].join('\n')).join('\n');
}

for (const tela of TELAS) {
  test(`CT-35: ${tela.nome} (${tela.rota}) sem violação serious ou critical do axe`, async ({ page }) => {
    if (tela.administrador) await entrarComo(page, 'administrador');
    await page.goto(tela.rota);
    if (tela.titulo) {
      await expect(page.getByRole('heading', { level: 1, name: tela.titulo })).toBeVisible();
    }
    // Espera os dados chegarem: o axe precisa da tela pronta, não do "Carregando...".
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Carregando/)).toHaveCount(0);

    const { violations } = await new AxeBuilder({ page }).withTags(REGRAS_WCAG).analyze();

    const usadas = new Set();
    const reprovadas = violations
      .filter((violacao) => IMPACTOS_QUE_REPROVAM.includes(violacao.impact))
      .map((violacao) => ({
        ...violacao,
        nodes: violacao.nodes.filter((no) => {
          const excecao = excecaoDo(violacao.id, tela.rota, no.target.join(' '));
          if (excecao) usadas.add(excecao);
          return !excecao;
        }),
      }))
      .filter((violacao) => violacao.nodes.length > 0);

    for (const excecao of usadas) {
      test.info().annotations.push({ type: 'exceção', description: `${excecao.bug} ${excecao.regra}: ${excecao.motivo}` });
    }
    for (const excecao of EXCECOES.filter((item) => item.rotas.includes(tela.rota) && !usadas.has(item))) {
      test.info().annotations.push({
        type: 'exceção sem uso',
        description: `${excecao.bug} ${excecao.regra} em ${excecao.seletor.source} não apareceu: se o bug foi corrigido, apague a exceção.`,
      });
    }

    expect(reprovadas, `Violações do axe em ${tela.rota}:\n${descrever(reprovadas)}`).toEqual([]);
  });
}

// Parte automática do CT-36 (#283): no portal, a primeira parada do Tab é
// "Pular para o conteúdo", que aparece com o foco e leva ao main.
const TELAS_DO_PORTAL = TELAS.filter((tela) => tela.titulo && !tela.rota.startsWith('/admin'));

for (const tela of TELAS_DO_PORTAL) {
  test(`CT-36: ${tela.nome} (${tela.rota}) começa o Tab por "Pular para o conteúdo"`, async ({ page }) => {
    await page.goto(tela.rota);
    await expect(page.getByRole('heading', { level: 1, name: tela.titulo })).toBeVisible();
    const pular = page.getByRole('link', { name: 'Pular para o conteúdo' });
    await expect(pular).not.toBeInViewport();

    await page.keyboard.press('Tab');
    await expect(pular).toBeFocused();
    await expect(pular).toBeInViewport();

    await page.keyboard.press('Enter');
    await expect(page.getByRole('main')).toBeFocused();
    await expect(page).toHaveURL(new URL(tela.rota, page.url()).href);

    // A parada seguinte já está no conteúdo, e não no menu.
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.querySelector('main').contains(document.activeElement))).toBe(true);
  });
}
