import { expect, test } from '@playwright/test';
import { nomeUnico } from '../ajudantes/api.js';
import { entrarComo } from '../ajudantes/sessao.js';

async function conferirNaJanela(elemento) {
  await expect(elemento).toBeFocused();
  await expect.poll(() => elemento.evaluate((el) => {
    const area = el.getBoundingClientRect();
    return area.top >= 70 && area.bottom <= innerHeight;
  })).toBe(true);
}

test('a edição recebe foco e o erro de perfil fica visível sem perder os campos', async ({ page }) => {
  await entrarComo(page, 'administrador');
  await page.goto('/admin/usuarios');
  await expect(page).toHaveTitle('Usuários · Painel administrativo · Observatório do Turismo');
  const editar = page.getByRole('button', { name: 'Alterar perfil de Administrador', exact: true });
  await editar.click();
  const perfil = page.getByRole('combobox', { name: 'Novo perfil', exact: true });
  await conferirNaJanela(perfil);
  await perfil.selectOption('editor');
  await page.getByRole('button', { name: 'Salvar perfil', exact: true }).click();

  const erro = page.getByRole('alert');
  await expect(erro).toHaveText('Você não pode desativar nem rebaixar o próprio usuário');
  await conferirNaJanela(erro);
  await expect(perfil).toHaveValue('editor');
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(editar).toBeFocused();

  await page.getByRole('button', { name: 'Alterar perfil de Editor', exact: true }).click();
  await page.getByRole('button', { name: 'Salvar perfil', exact: true }).click();
  const sucesso = page.getByRole('status');
  await expect(sucesso).toHaveText('Perfil de Editor atualizado com sucesso.');
  await conferirNaJanela(sucesso);

  await page.getByRole('button', { name: 'Redefinir senha de Editor', exact: true }).click();
  await conferirNaJanela(page.getByLabel('Nova senha', { exact: true }));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('CT-32: e-mail repetido preserva o cadastro e leva o foco à mensagem', async ({ page }) => {
  await entrarComo(page, 'administrador');
  await page.goto('/admin/usuarios');
  const nome = nomeUnico('Editora');
  await page.getByRole('textbox', { name: 'Nome', exact: true }).fill(nome);
  await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill('editor@observatorio.local');
  await page.getByLabel('Senha inicial', { exact: true }).fill('senha-de-teste-local');
  await page.getByRole('button', { name: 'Criar usuário', exact: true }).click();

  const erro = page.getByRole('alert');
  await expect(erro).toHaveText('Já existe um usuário com este e-mail');
  await conferirNaJanela(erro);
  await expect(page.getByRole('textbox', { name: 'Nome', exact: true })).toHaveValue(nome);
  await expect(page.getByRole('textbox', { name: 'E-mail', exact: true })).toHaveValue('editor@observatorio.local');
  await expect(page.getByLabel('Senha inicial', { exact: true })).toHaveValue('senha-de-teste-local');
});
