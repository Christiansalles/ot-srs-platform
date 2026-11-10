import { expect, test } from '@playwright/test';

test('rola a tabela no celular e mantém a coluna Indicador visível', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'A coluna fixa faz parte do layout para celular.');

  await page.goto('/indicadores');
  const regiao = page.getByRole('region', { name: 'Tabela de indicadores turísticos' });
  const indicador = regiao.getByRole('columnheader', { name: 'Indicador' });
  const nome = regiao.getByRole('row').nth(1).getByRole('cell').first();
  const valor = regiao.getByRole('columnheader', { name: 'Valor' });

  await expect(indicador).toBeVisible();
  const posicaoHorizontal = (elemento) => elemento.evaluate((el) => el.getBoundingClientRect().left);
  const inicioIndicador = await posicaoHorizontal(indicador);
  const inicioNome = await posicaoHorizontal(nome);

  await regiao.focus();
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => regiao.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
  await regiao.evaluate((el) => { el.scrollLeft = el.scrollWidth; });

  expect(await posicaoHorizontal(indicador)).toBeCloseTo(inicioIndicador, 0);
  expect(await posicaoHorizontal(nome)).toBeCloseTo(inicioNome, 0);
  const areaTabela = await regiao.boundingBox();
  const areaIndicador = await indicador.boundingBox();
  const areaValor = await valor.boundingBox();
  expect(areaValor.x).toBeGreaterThanOrEqual(areaIndicador.x + areaIndicador.width);
  expect(areaValor.x + areaValor.width).toBeLessThanOrEqual(areaTabela.x + areaTabela.width);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
