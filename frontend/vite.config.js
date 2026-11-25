import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
    coverage: {
      // O CI publica o text-summary no Summary e o html e o json-summary como artefato.
      // maxCols evita que a tabela corte o nome dos arquivos quando a saída não é um terminal.
      reporter: [['text', { maxCols: 200 }], 'text-summary', 'html', 'json-summary'],
    },
  },
})
