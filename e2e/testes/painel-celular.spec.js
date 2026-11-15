import { expect, test } from '@playwright/test';
import { entrarComo } from '../ajudantes/sessao.js';

async function conferirAreaDeToque(controle) {
  await expect(controle).toBeVisible();
  const area = await controle.boundingBox();
  expect(area.width).toBeGreaterThanOrEqual(44);
  expect(area.height).toBeGreaterThanOrEqual(44);
}

async function conferirLarguraDaPagina(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

async function conferirTabela(page, nome, acao) {
  const tabela = page.getByRole('region', { name: nome });
  await tabela.focus();
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => tabela.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
  await acao.scrollIntoViewIfNeeded();
  await expect(acao).toBeInViewport({ ratio: 1 });
  await conferirAreaDeToque(acao);
  await conferirLarguraDaPagina(page);
}

test('o painel em 375 px mantém controles alcançáveis e rolagem dentro das tabelas', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'O cenário confere a interface de celular (#269).');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/admin/login');
  const mostrarSenha = page.getByRole('button', { name: 'Mostrar senha' });
  await conferirAreaDeToque(mostrarSenha);
  await mostrarSenha.tap();
  await expect(page.getByLabel('Senha', { exact: true })).toHaveAttribute('type', 'text');
  await conferirLarguraDaPagina(page);

  await entrarComo(page, 'administrador');
  const abrirMenu = page.getByRole('button', { name: 'Abrir menu' });
  const menu = page.getByRole('navigation', { name: 'Menu administrativo' });
  await conferirAreaDeToque(abrirMenu);
  await conferirAreaDeToque(page.getByRole('button', { name: 'Sair' }));
  await expect(menu).toBeHidden();
  await abrirMenu.tap();
  await expect(menu).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(abrirMenu).toBeFocused();

  const editarMedicao = page.getByRole('link', { name: /^Editar Número de leitos,/ }).first();
  await conferirTabela(page, 'Tabela de indicadores do painel', editarMedicao);

  await abrirMenu.tap();
  await menu.getByRole('link', { name: 'Cadastrar medição' }).tap();
  await expect(menu).toBeHidden();
  await conferirAreaDeToque(page.getByRole('button', { name: 'Salvar como rascunho' }));
  await conferirLarguraDaPagina(page);

  await abrirMenu.tap();
  await menu.getByRole('link', { name: 'Relatórios' }).tap();
  await expect(menu).toBeHidden();
  await conferirAreaDeToque(page.getByRole('button', { name: 'Enviar relatório' }));
  await conferirTabela(page, 'Tabela de relatórios enviados', page.getByRole('button', { name: /^Despublicar / }).first());

  await abrirMenu.tap();
  await menu.getByRole('link', { name: 'Usuários' }).tap();
  await expect(menu).toBeHidden();
  await conferirAreaDeToque(page.getByRole('button', { name: 'Criar usuário' }));
  await conferirTabela(page, 'Tabela de usuários', page.getByRole('button', { name: /^Alterar perfil de / }).first());

  await page.setViewportSize({ width: 375, height: 320 });
  await abrirMenu.tap();
  const portal = page.getByRole('link', { name: 'Ver Portal Público' });
  await portal.scrollIntoViewIfNeeded();
  await expect(portal).toBeInViewport({ ratio: 1 });
});
