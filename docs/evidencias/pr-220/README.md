# Evidências do PR #220: painel de gestão de indicadores

As capturas foram feitas na branch do PR (`2af8270`) contra a API real, com Postgres e o seed. A sessão era do perfil editor, no Chrome, em 375 e 1280 px. Para o selo e o contador de rascunho aparecerem, foram criadas pela API duas medições de 2026/1 em rascunho: Número de leitos, 360, e Taxa de ocupação, 71. Nenhuma página rola na horizontal nem mostra erro no console.

| Arquivo | O que mostra |
|---|---|
| `painel-375.png`, `painel-1280.png` | `/admin` com os contadores (12 indicadores, 23 publicadas, 2 rascunhos), a busca, os filtros e a tabela. Em 375 px, a tabela rola dentro do cartão |
| `painel-rascunhos-375.png`, `painel-rascunhos-1280.png` | Filtro "Rascunho": só as duas medições de 2026/1, com o `StatusBadge` de rascunho e o link "Editar" |
