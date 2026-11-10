import { expect, test } from '@playwright/test';

test('o nome do departamento no login tem contraste AA', async ({ page }) => {
  await page.goto('/admin/login');
  const departamento = page.getByText('SMCELT', { exact: true });
  await expect(departamento).toBeVisible();

  const contraste = await departamento.evaluate((elemento) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const contexto = canvas.getContext('2d', { willReadFrequently: true });
    const ancestrais = [];
    for (let atual = elemento; atual; atual = atual.parentElement) ancestrais.unshift(atual);

    for (const ancestral of ancestrais) {
      contexto.fillStyle = getComputedStyle(ancestral).backgroundColor;
      contexto.fillRect(0, 0, 1, 1);
    }
    const fundo = contexto.getImageData(0, 0, 1, 1).data;
    contexto.fillStyle = getComputedStyle(elemento).color;
    contexto.fillRect(0, 0, 1, 1);
    const texto = contexto.getImageData(0, 0, 1, 1).data;

    function luminancia(cor) {
      const componentes = Array.from(cor).slice(0, 3).map((valor) => {
        const canal = valor / 255;
        return canal <= 0.04045 ? canal / 12.92 : ((canal + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * componentes[0] + 0.7152 * componentes[1] + 0.0722 * componentes[2];
    }

    const luminosidades = [luminancia(texto), luminancia(fundo)].sort((a, b) => b - a);
    return (luminosidades[0] + 0.05) / (luminosidades[1] + 0.05);
  });

  expect(contraste).toBeGreaterThanOrEqual(4.5);
});
