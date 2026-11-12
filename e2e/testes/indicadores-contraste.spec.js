import { expect, test } from '@playwright/test';

function luminancia(cor) {
  const [vermelho, verde, azul] = cor.match(/\d+(?:\.\d+)?/g).slice(0, 3).map((valor) => {
    const canal = Number(valor) / 255;
    return canal <= 0.04045 ? canal / 12.92 : ((canal + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * vermelho + 0.7152 * verde + 0.0722 * azul;
}

test('os seis títulos da tabela de Indicadores têm contraste de pelo menos 4,5:1', async ({ page }) => {
  await page.goto('/indicadores');
  const tabela = page.getByRole('region', { name: 'Tabela de indicadores turísticos' });
  const cabecalhos = tabela.getByRole('columnheader');
  await expect(cabecalhos).toHaveCount(6);

  const cores = await cabecalhos.evaluateAll((elementos) => elementos.map((elemento) => {
    const { color, backgroundColor } = getComputedStyle(elemento);
    return { titulo: elemento.textContent, texto: color, fundo: backgroundColor };
  }));

  for (const { titulo, texto, fundo } of cores) {
    const luminancias = [luminancia(texto), luminancia(fundo)];
    const contraste = (Math.max(...luminancias) + 0.05) / (Math.min(...luminancias) + 0.05);
    expect(contraste, titulo).toBeGreaterThanOrEqual(4.5);
  }
});
