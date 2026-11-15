import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { consultar, criarIndicador, criarMedicao, idDoSetor, nomeUnico, PRIMEIRO_ANO_DE_TESTE, tokenDe } from '../ajudantes/api.js';

const hospedagem = JSON.parse(readFileSync(new URL('../../backend/prisma/dados/hospedagem.json', import.meta.url)));
const turismo = JSON.parse(readFileSync(new URL('../../backend/prisma/dados/turismo.json', import.meta.url)));
const participacao = JSON.parse(readFileSync(new URL('../../backend/prisma/dados/participacao.json', import.meta.url)));
const destaques = [hospedagem.indicadores[0], ...turismo.indicadores.slice(0, 3)];
const linhasDaCarga = [
  ...[hospedagem, turismo].flatMap(({ setor, indicadores }) => indicadores.flatMap((indicador) =>
    indicador.medicoes.map((medicao) => ({ ...medicao, nome: indicador.nome, unidade: indicador.unidade, setor: setor.nome })))),
  ...participacao.setores.flatMap((setor) => setor.medicoes.map((medicao) =>
    ({ ...medicao, nome: participacao.indicador.nome, unidade: participacao.indicador.unidade, setor: setor.nome }))),
];

function celulasDaLinha(linha) {
  return [linha.nome, linha.setor, linha.unidade, String(linha.periodo.ano), String(linha.periodo.semestre), linha.valor.toLocaleString('pt-BR')];
}

async function conferirCard(cards, indicador, ano = 2025) {
  const medicao = indicador.medicoes.find((item) => item.periodo.ano === ano);
  const card = cards.filter({ has: cards.page().getByRole('heading', { name: indicador.nome, exact: true }) });
  await expect(card).toHaveCount(1);
  await expect(card.getByText(`${medicao.valor.toLocaleString('pt-BR')} ${indicador.unidade}`, { exact: true })).toBeVisible();
  await expect(card).toContainText(indicador.unidade);
  await expect(card).toContainText(`${ano}/${medicao.periodo.semestre}`);
}

async function conferirAnoNaUrl(page, ano) {
  await expect.poll(() => new URL(page.url()).searchParams.get('ano')).toBe(String(ano));
}

test('CT-01: Home mostra os quatro destaques da carga em 2025/2', async ({ page }) => {
  await page.goto('/');
  const secao = page.locator('section', { has: page.getByRole('heading', { name: 'Indicadores em destaque', exact: true }) });
  const cards = secao.getByRole('article');
  await expect(cards.getByRole('heading')).toHaveText(destaques.map(({ nome }) => nome));
  for (const indicador of destaques) await conferirCard(cards, indicador);
});

test('CT-02: navega pelo menu principal, incluindo abrir e fechar no celular', async ({ page, isMobile }) => {
  await page.goto('/');
  const menu = page.getByRole('button', { name: 'Menu principal', exact: true });
  if (isMobile) {
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await menu.click();
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    await menu.click();
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
  }
  for (const [nome, rota, titulo] of [
    ['Indicadores', '/indicadores', 'Indicadores turísticos'],
    ['Dashboard', '/dashboard', 'Dashboard'],
    ['Relatórios', '/relatorios', 'Relatórios'],
  ]) {
    if (isMobile) await menu.click();
    await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: nome, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${rota}$`));
    await expect(page.getByRole('heading', { level: 1, name: titulo, exact: true })).toBeVisible();
    if (isMobile) await expect(menu).toHaveAttribute('aria-expanded', 'false');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test('CT-03: tabela apresenta setor, unidade, período e valores da carga sem cortar a página', async ({ page, isMobile }) => {
  await page.goto('/indicadores');
  const tabela = page.getByRole('table');
  await expect(tabela.getByRole('columnheader')).toHaveText(['Indicador', 'Setor', 'Unidade', 'Ano', 'Semestre', 'Valor']);
  await expect.poll(() => tabela.locator('tbody tr').evaluateAll((linhas) =>
    linhas.map((linha) => Array.from(linha.cells, (celula) => celula.textContent.trim()))))
    .toEqual(expect.arrayContaining(linhasDaCarga.map(celulasDaLinha)));
  if (isMobile) {
    const regiao = page.getByRole('region', { name: 'Tabela de indicadores turísticos' });
    await tabela.getByRole('columnheader', { name: 'Indicador', exact: true }).scrollIntoViewIfNeeded();
    await regiao.evaluate((el) => { el.scrollLeft = el.scrollWidth; });
    const coluna = tabela.getByRole('columnheader', { name: 'Valor', exact: true });
    // Confere o texto, pois o canto arredondado recorta a borda da célula.
    const texto = await coluna.evaluate((el) => {
      const trecho = document.createRange();
      trecho.selectNodeContents(el);
      const area = trecho.getBoundingClientRect();
      return { esquerda: area.left, direita: area.right, topo: area.top, base: area.bottom };
    });
    const areaTabela = await regiao.boundingBox();
    expect(texto.esquerda).toBeGreaterThanOrEqual(areaTabela.x);
    expect(texto.direita).toBeLessThanOrEqual(areaTabela.x + areaTabela.width);
    expect(texto.topo).toBeGreaterThanOrEqual(0);
    expect(texto.base).toBeLessThanOrEqual(page.viewportSize().height);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('CT-04: setor e ano mudam a tabela e persistem na URL após recarregar', async ({ page, request }) => {
  const setor = await idDoSetor(request, 'Hospedagem');
  await page.goto('/indicadores');
  await page.getByRole('combobox', { name: 'Setor', exact: true }).selectOption({ label: 'Hospedagem' });
  await expect.poll(() => new URL(page.url()).searchParams.get('setor')).toBe(String(setor));
  await page.getByRole('combobox', { name: 'Período', exact: true }).selectOption('2024');
  await conferirAnoNaUrl(page, 2024);
  const esperadas = linhasDaCarga.filter((linha) => linha.setor === 'Hospedagem' && linha.periodo.ano === 2024).map(celulasDaLinha);
  for (const recarregar of [false, true]) {
    if (recarregar) await page.reload();
    await expect(page.getByRole('combobox', { name: 'Setor', exact: true })).toHaveValue(String(setor));
    await expect(page.getByRole('combobox', { name: 'Período', exact: true })).toHaveValue('2024');
    await expect.poll(() => page.getByRole('table').locator('tbody tr').evaluateAll((linhas) =>
      linhas.map((linha) => Array.from(linha.cells, (celula) => celula.textContent.trim())))).toEqual(esperadas);
    await conferirAnoNaUrl(page, 2024);
  }
});

test('CT-05: dashboard mostra cards, os três gráficos e a data de atualização', async ({ page, request }) => {
  const atualizacao = await consultar(request, '/api/indicadores/atualizacao');
  expect(atualizacao.atualizado_em).toBeTruthy();
  const data = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(new Date(atualizacao.atualizado_em));
  await page.goto('/dashboard');
  const cards = page.getByRole('region', { name: 'Indicadores turísticos', exact: true }).getByRole('article');
  for (const indicador of destaques) await conferirCard(cards, indicador);
  await expect(page.getByText(`Atualizado em ${data}`, { exact: true })).toBeVisible();
  for (const nome of ['Série histórica do indicador', 'Distribuição por setor', 'Comparativo anual']) {
    const grafico = page.getByRole('region', { name: nome, exact: true });
    await expect(grafico).toBeVisible();
    await expect(grafico.locator('svg').first()).toBeVisible();
  }
});

test('CT-06: filtrar 2024 no dashboard muda leitos para 312', async ({ page }) => {
  await page.goto('/dashboard');
  const cards = page.getByRole('region', { name: 'Indicadores turísticos', exact: true }).getByRole('article');
  await conferirCard(cards, hospedagem.indicadores[0]);
  await page.getByRole('combobox', { name: 'Período', exact: true }).selectOption('2024');
  await conferirAnoNaUrl(page, 2024);
  await conferirCard(cards, hospedagem.indicadores[0], 2024);
});

for (const [rota, mensagem] of [
  ['/indicadores', /^Sem dados para os filtros selecionados/],
  ['/dashboard', 'Sem indicadores disponíveis no momento.'],
]) {
  test(`CT-07: ano sem dados mostra o vazio em ${rota}`, async ({ page }) => {
    test.fixme(true, 'Bug #307: a normalização remove ano=2019 da URL e mostra a carga completa.');
    await page.goto(`${rota}?ano=2019`);
    await expect(page.getByText(mensagem)).toBeVisible();
    await conferirAnoNaUrl(page, 2019);
    await expect(page.getByRole('article')).toHaveCount(0);
    await expect(page.getByRole('table')).toHaveCount(0);
    await expect(page.getByRole('alert')).toHaveCount(0);
  });
}

test('CT-08: endereço inexistente mostra 404, menu, rodapé e link para Home', async ({ page, isMobile }) => {
  await page.goto('/qualquer-coisa');
  await expect(page.getByRole('heading', { level: 1, name: 'Página não encontrada' })).toBeVisible();
  await expect(page.getByRole('contentinfo')).toBeVisible();
  if (isMobile) await page.getByRole('button', { name: 'Menu principal' }).click();
  await expect(page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: 'Home', exact: true })).toBeVisible();
  if (isMobile) await page.getByRole('button', { name: 'Menu principal' }).click();
  await page.getByRole('link', { name: 'Voltar à página inicial', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Indicadores do Turismo' })).toBeVisible();
});

test('CT-09: rascunho de 2031 não aparece nas telas públicas nem no filtro de ano', async ({ page, request }) => {
  const token = await tokenDe(request, 'administrador');
  const indicador = await criarIndicador(request, token, {
    idSetor: await idDoSetor(request, 'Hospedagem'), nome: nomeUnico('Rascunho portal'), unidade: 'leitos',
  });
  const medicao = await criarMedicao(request, token, { idIndicador: indicador.id, ano: PRIMEIRO_ANO_DE_TESTE, semestre: 1, valor: hospedagem.indicadores[0].medicoes.at(-1).valor });
  expect(medicao.status).toBe('rascunho');
  for (const rota of ['/', '/indicadores', '/dashboard']) {
    await page.goto(rota);
    if (rota === '/') await expect(page.getByRole('article')).toHaveCount(4);
    else if (rota === '/indicadores') await expect(page.getByRole('table')).toBeVisible();
    else await expect(page.getByRole('region', { name: 'Indicadores turísticos', exact: true })).toBeVisible();
    await expect(page.getByRole('main')).not.toContainText(indicador.nome);
    await expect(page.getByRole('main')).not.toContainText(`${PRIMEIRO_ANO_DE_TESTE}/1`);
    if (rota !== '/') {
      const opcoes = page.getByRole('combobox', { name: 'Período', exact: true }).locator('option');
      await expect(opcoes.filter({ hasText: '2025' })).toHaveCount(1);
      await expect(opcoes.filter({ hasText: String(PRIMEIRO_ANO_DE_TESTE) })).toHaveCount(0);
    }
  }
});
