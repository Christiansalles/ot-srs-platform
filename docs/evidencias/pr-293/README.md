# PR #293: contraste do departamento no login

Correção da #285: o nome SMCELT usa o token `--color-text-secondary`.

As quatro imagens foram preservadas, sem edição, dos anexos da descrição original do PR da Maria Clara. Elas mostram o antes e o depois em 390 x 844 e 1280 x 800 px. O teste `login-contraste.spec.js` mede o contraste no navegador nos dois projetos do Playwright.

| Arquivos | Conteúdo |
|---|---|
| `antes-390.png`, `antes-1280.png` | Token anterior, contraste aproximado de 4,27:1 |
| `depois-390.png`, `depois-1280.png` | Token corrigido, contraste aproximado de 8,42:1 |

Origens dos anexos: `87acc0df-3439-4a47-a97d-8f48d02691b3`, `8e6f0450-1d36-48da-bea3-cdaa5b9153fa`, `1cd7fd77-c7cf-4ae7-b7e7-72cb0472633f` e `e75a4199-5955-4018-b000-3082368bd645`, respectivamente, em `https://github.com/user-attachments/assets/`.

A rodada de revisão de 12/11 também confere a tela com a API real e remove a exceção da #285 no axe. Os arquivos ficam versionados e a descrição do PR usa URLs raw fixadas no commit das evidências.

`revisao-390.jpg` e `revisao-1280.jpg`: capturas adicionais em 12/11/2026, no Chromium do navegador integrado, com Vite apontando para a API real do Compose isolado da revisão (porta 3302). Confirmam o acabamento atual do login nas duas larguras.
