import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import {
  baixarArquivoDoRelatorio,
  consultar,
  criarRelatorio,
  nomeUnico,
  tokenDe,
} from '../ajudantes/api.js';

// Casos CT-11 a CT-15 do plano de testes (docs/testes/plano-de-testes.md).
// Os valores são os da carga: backend/prisma/dados/relatorios/relatorios.json.
// Os dois têm a mesma data, então o cadastrado por último (Participação) vem primeiro.
const RELATORIOS_DA_CARGA = [
  {
    titulo: 'Participação econômica do turismo',
    edicao: 'OT-ILUS-02/2025',
    categoria: 'Impacto Econômico',
    data: '21/10/2026',
    tamanho: '231 KB',
  },
  {
    titulo: 'Indicadores do setor hoteleiro',
    edicao: 'OT-ILUS-01/2025',
    categoria: 'Setor Hoteleiro',
    data: '21/10/2026',
    tamanho: '193 KB',
  },
];
const HOTELEIRO = RELATORIOS_DA_CARGA[1];

function listaDe(page) {
  return page.getByRole('region', { name: 'Publicações disponíveis' });
}

function cardsDe(page) {
  return listaDe(page).getByRole('article');
}

test('CT-11: /relatorios mostra os dois relatórios da carga com os dados de cada um', async ({ page }) => {
  await page.goto('/relatorios');

  const cards = cardsDe(page);
  await expect(cards).toHaveCount(RELATORIOS_DA_CARGA.length);
  await expect(cards.getByRole('heading', { level: 3 })).toHaveText(RELATORIOS_DA_CARGA.map((r) => r.titulo));

  for (const [indice, relatorio] of RELATORIOS_DA_CARGA.entries()) {
    const card = cards.nth(indice);
    await expect(card).toContainText(`Edição ${relatorio.edicao}`);
    await expect(card).toContainText(relatorio.categoria);
    await expect(card).toContainText(`Publicado em ${relatorio.data}`);
    await expect(card).toContainText(`PDF · ${relatorio.tamanho}`);
    await expect(card.getByRole('link', { name: `Baixar PDF: ${relatorio.titulo}` })).toBeVisible();
  }
});

test('CT-12: filtro por categoria e ano fica na URL e continua depois de recarregar', async ({ page }) => {
  await page.goto('/relatorios');
  await expect(cardsDe(page)).toHaveCount(RELATORIOS_DA_CARGA.length);

  await page.getByLabel('Categoria').selectOption({ label: 'Setor Hoteleiro' });
  await expect(page).toHaveURL(/[?&]categoria=Setor(\+|%20)Hoteleiro/);
  await expect(cardsDe(page).getByRole('heading', { level: 3 })).toHaveText([HOTELEIRO.titulo]);

  await page.getByLabel('Ano de publicação').selectOption('2026');
  await expect(page).toHaveURL(/[?&]ano=2026/);
  await expect(cardsDe(page).getByRole('heading', { level: 3 })).toHaveText([HOTELEIRO.titulo]);

  await page.reload();
  await expect(page.getByLabel('Categoria')).toHaveValue('Setor Hoteleiro');
  await expect(page.getByLabel('Ano de publicação')).toHaveValue('2026');
  await expect(cardsDe(page).getByRole('heading', { level: 3 })).toHaveText([HOTELEIRO.titulo]);
});

test('CT-13: ano sem relatório, vindo pela URL, mostra o estado vazio', async ({ page }) => {
  await page.goto('/relatorios?ano=2025');

  await expect(listaDe(page).getByText('Nenhum relatório publicado para esse filtro')).toHaveRole('status');
  await expect(cardsDe(page)).toHaveCount(0);
});

test('CT-14: "Baixar PDF" baixa um PDF com o nome da edição e do título', async ({ page }) => {
  await page.goto('/relatorios');
  const card = cardsDe(page).filter({ has: page.getByRole('heading', { name: HOTELEIRO.titulo }) });

  const resposta = page.waitForResponse((r) => /\/api\/relatorios\/\d+\/arquivo$/.test(r.url()));
  const download = page.waitForEvent('download');
  await card.getByRole('link', { name: `Baixar PDF: ${HOTELEIRO.titulo}` }).click();

  expect((await resposta).headers()['content-type']).toContain('application/pdf');
  const arquivo = await download;
  expect(arquivo.suggestedFilename()).toBe('ot-ilus-01-2025-indicadores-do-setor-hoteleiro.pdf');
  const conteudo = await readFile(await arquivo.path());
  expect(conteudo.subarray(0, 4).toString()).toBe('%PDF');
  await expect(card.getByRole('alert')).toHaveCount(0);
});

test('CT-15: relatório em rascunho não aparece na lista e o download dele dá 404', async ({ page, request }) => {
  const token = await tokenDe(request, 'administrador');
  const titulo = nomeUnico('Relatório em rascunho');
  const rascunho = await criarRelatorio(request, token, { titulo });
  expect(rascunho.status).toBe('rascunho');

  const noPainel = await consultar(request, '/api/admin/relatorios', token);
  expect(noPainel.map((item) => item.titulo)).toContain(titulo);

  await page.goto('/relatorios');
  await expect(cardsDe(page)).toHaveCount(RELATORIOS_DA_CARGA.length);
  await expect(page.getByText(titulo)).toHaveCount(0);

  const download = await baixarArquivoDoRelatorio(request, rascunho.id);
  expect(download.status()).toBe(404);
  expect(await download.json()).toEqual({ erro: 'Relatório não encontrado' });
});
