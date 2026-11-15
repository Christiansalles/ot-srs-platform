import { defineConfig } from '@playwright/test';

// Os testes rodam contra o sistema de pé no Docker Compose (front :8080, API :3000).
// As variáveis só existem para apontar para outro endereço; o padrão é o do compose.
const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:8080';

export default defineConfig({
  testDir: './testes',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  // Sem retentativa: teste que só passa na segunda vez esconde bug, e cada falha vira issue.
  retries: 0,
  // No CI a máquina é pequena e o banco é um só; em paralelo os testes disputariam a API.
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'on-failure' }]],
  use: {
    baseURL: BASE_URL,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: {
        browserName: 'chromium',
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: 'celular',
      use: {
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 3,
      },
    },
  ],
});
