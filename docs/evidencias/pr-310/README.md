# Evidências do PR #310 · Filtros sem dados

Capturas no Microsoft Edge, com o frontend em Vite e a API real no Docker Compose isolado. O antes foi registrado na `develop` em `71b0f92`.

| Página | Larguras | Antes | Depois |
|---|---|---|---|
| `/indicadores?ano=2019` | 390 e 1280 px | `antes-indicadores-*.png` | `depois-indicadores-*.png` |
| `/dashboard?ano=2019` | 390 e 1280 px | `antes-dashboard-*.png` | `depois-dashboard-*.png` |

Antes, as páginas voltavam para «Todos os períodos» e exibiam os dados da carga completa. Depois, o seletor mantém 2019 e a página mostra a mensagem de ausência de dados.

O CT-07 cobre também `setor=999` e verifica que «Limpar filtros» restaura os dados nas duas páginas.
