import { expect } from '@playwright/test';
import { usuarioDe } from './usuarios.js';

// Entra pela tela de login, como uma pessoa faria, e espera o painel abrir.
// Login certo não conta para o limite de tentativas, então dá para chamar em todo teste.
export async function entrarComo(page, perfil) {
  const { email, senha } = usuarioDe(perfil);

  await page.goto('/admin/login');
  await page.getByLabel('E-mail', { exact: true }).fill(email);
  await page.getByLabel('Senha', { exact: true }).fill(senha);
  await page.getByRole('button', { name: 'Entrar' }).click();

  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Indicadores' })).toBeVisible();
}
