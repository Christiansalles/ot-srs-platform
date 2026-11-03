import { expect, test } from '@playwright/test';

// A ordem é a da Home (DESTAQUES_DA_HOME em frontend/src/pages/HomePage.jsx).
const DESTAQUES_DA_HOME = [
  'Número de leitos',
  'Fluxo de visitantes',
  'Número de empresas',
  'Empregos no setor',
];

test('a Home abre e mostra os quatro destaques', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1, name: 'Indicadores do Turismo' })).toBeVisible();

  const secao = page.locator('section', {
    has: page.getByRole('heading', { name: 'Indicadores em destaque' }),
  });
  const cards = secao.getByRole('article');

  await expect(cards).toHaveCount(DESTAQUES_DA_HOME.length);
  await expect(cards.getByRole('heading')).toHaveText(DESTAQUES_DA_HOME);
  // O primeiro card é o de leitos, com o valor de 2025/2 da carga.
  await expect(cards.first()).toContainText('350');
  await expect(cards.first()).toContainText('2025/2');
});
