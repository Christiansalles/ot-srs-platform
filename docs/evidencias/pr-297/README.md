# Evidências do PR #297 · Contraste da tabela de Indicadores

Capturas de `/indicadores?setor=1&ano=2025` no Edge com Vite e `VITE_USE_MOCK=true`. O antes foi registrado na `develop` em `62c5428`.

| Largura | Antes | Depois |
|---|---|---|
| 390 px | `antes-390.png` | `depois-390.png` |
| 1280 px | `antes-1280.png` | `depois-1280.png` |

Nas duas larguras, o contraste medido nos seis títulos passou de 4,34:1 para 8,56:1. A verificação `color-contrast` do axe-core 4.14 apontou os seis títulos antes da correção e passou na região da tabela depois.
