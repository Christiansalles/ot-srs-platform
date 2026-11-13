# Evidências do PR #306: "Pular para o conteúdo" no portal

Capturas com `docker compose up --build` e a API real, no Chromium do Playwright, em 390 e 1280 px, na página de Indicadores. Os passos foram feitos só com o teclado.

| Arquivo | O que mostra |
|---|---|
| `pular-com-foco-390.png` | Primeiro Tab: o link "Pular para o conteúdo" aparece no topo, com o foco visível |
| `proxima-parada-390.png` | Depois de Enter e de mais um Tab: o foco já está no primeiro filtro, sem passar pelo menu |
| `pular-com-foco-1280.png` | O mesmo primeiro Tab no desktop |
| `proxima-parada-1280.png` | O foco no filtro "Período" depois de pular o cabeçalho |

O "antes" (a primeira parada era "Home") está na auditoria, em [pr-281](../pr-281/README.md), nos arquivos `a2-portal-sem-pular-conteudo-390.png` e `a2-portal-sem-pular-conteudo-1280.png`.
