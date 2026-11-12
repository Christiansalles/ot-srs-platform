const FORMATO_DATA = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

// A API devolve ISO 8601 em UTC; o portal mostra a data no fuso de Brasília.
// Sem data (null) ou data inválida, devolve '' e quem chama esconde o texto.
export function formatarData(iso) {
  if (!iso) return ''

  const data = new Date(iso)
  if (Number.isNaN(data.getTime())) return ''

  return FORMATO_DATA.format(data)
}
