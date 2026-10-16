# Evidências do PR #130

Capturas do card "Comparativo anual" no `/dashboard`, com `npm run dev` e `VITE_USE_MOCK=true`, no Chrome.

| Arquivo | Largura | O que mostra |
|---|---|---|
| `antes-360.png` | 360 px | Antes da correção: o rótulo "Empresas" some do eixo X. |
| `antes-320.png` | 320 px | Antes da correção: somem "Leitos" e "Empresas". |
| `depois-320.png` | 320 px | Depois da correção: os quatro rótulos aparecem. |
| `depois-1280.png` | 1280 px | Depois da correção: o desktop continua igual. |

O Recharts esconde rótulos do eixo X quando calcula que eles não cabem. A correção usa `interval={0}` no `XAxis`, deixa o `YAxis` com 40 px de largura e diminui a fonte do eixo X para 10 px abaixo de 640 px.
