import { afterEach, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

it('usa a URL configurada e remove a barra final', async () => {
  vi.stubEnv('VITE_API_URL', 'https://api.example.com/')
  const { API_URL } = await import('../config')
  expect(API_URL).toBe('https://api.example.com')
})

it('usa a API local quando a variável não está configurada', async () => {
  vi.stubEnv('VITE_API_URL', '')
  const { API_URL } = await import('../config')
  expect(API_URL).toBe('http://localhost:3000')
})
