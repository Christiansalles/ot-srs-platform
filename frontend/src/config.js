// Base sem /api: as chamadas devem adicionar o caminho completo da rota.
export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000') // 3000 como padrão
  .replace(/\/+$/, '')
