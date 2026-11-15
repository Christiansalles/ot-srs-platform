# Evidências do PR #305: Sair do painel volta à página inicial

Capturas com `docker compose up --build` e a API real, no Chromium do Playwright, em 390 e 1280 px. No celular a sessão é do editor; no desktop, do administrador.

| Arquivo | O que mostra |
|---|---|
| `painel-antes-de-sair-390.png` | Painel do editor no celular, com o botão "Sair" no topo |
| `depois-de-sair-390.png` | Depois de clicar em "Sair": a página inicial do portal, sem sessão |
| `painel-antes-de-sair-1280.png` | Painel do administrador no desktop, com o botão "Sair" no topo |
| `depois-de-sair-1280.png` | Depois de clicar em "Sair": a página inicial do portal, sem sessão |

O comportamento antigo (a tela de login depois de sair) está no print do CT-18 em [pr-299](../pr-299/README.md), o mesmo da issue #298.
