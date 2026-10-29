# Identidade visual

Fonte: páginas 6 e 7 da Proposta (ver [escopo](escopo.md)). A Proposta toma como referência a identidade já usada nos relatórios do Observatório (Relatório OT nº 004/2025), que o grupo não tem. O que vale está nesta página e em `frontend/src/theme/`.

## Cores

**Cor primária: gradiente diagonal** `#0A4AAD → #6C5CE0 → #C750D6`.

**Cores de apoio, para visualização de dados:**

| Cor | Nome | Token em `theme/colors.js` |
|---|---|---|
| `#5FE6E0` | Ciano | `chart.cyan` |
| `#6C5CE0` | Roxo | `chart.violet` |
| `#27B7FD` | Azul-céu | `chart.sky` |
| `#B986ED` | Lilás | `chart.lilac` |
| `#F3B8F7` | Lilás claro | `chart.softLilac` |
| `#FADA77` | Amarelo | `chart.yellow` |

**Diretriz da Proposta:** usar o gradiente como cor de destaque (capa, cabeçalhos, botões primários) e a paleta de apoio nos gráficos do dashboard, mantendo **fundo claro** no restante da interface.

No código:

- `frontend/src/theme/colors.js` e `theme.css` definem as cores, incluindo neutros, sucesso e erro, que a Proposta não define;
- use sempre os tokens do tema; não escreva cor solta em hexadecimal nos componentes;
- o painel administrativo segue a mesma identidade das páginas públicas (decisão do M6).

## Logotipos

A Proposta organiza as marcas em três níveis. Os arquivos estão em `frontend/src/assets/logos/`.

| Nível | Marcas | Arquivos |
|---|---|---|
| 1 · Marca do projeto | Observatório do Turismo e marca de Santa Rita do Sapucaí | `observatorio.png`, `santa-rita.svg` |
| 2 · Realização e apoio | Prefeitura, SMCELT, COMTUR | `prefeitura.png`, `smcelt.png`, `comtur.png` |
| 3 · Contexto regional | Caminhos da Mantiqueira, Minas Gerais | `mantiqueira.png`, `minas.png` |

Hoje, em `frontend/src/App.jsx`, o cabeçalho mostra a marca de Santa Rita e a do Observatório, e o rodapé mostra os três níveis. A origem de cada arquivo está em [evidencias/pr-48](../evidencias/pr-48/README.md).

## Mockups e sistema de design

As telas do Milestone III estão em [referencias/stitch](../referencias/stitch/README.md), junto com o arquivo de design do Stitch (tipografia Plus Jakarta Sans, espaçamento e componentes). O mockup é referência de layout; as cores e os números que valem são os desta página e da carga.
