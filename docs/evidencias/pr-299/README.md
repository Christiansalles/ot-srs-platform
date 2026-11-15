# Evidências do PR #299 · E2E do painel

`ct-18-apos-sair-1280.png` é a captura automática do Playwright em Chromium (1280 × 800 px) com Docker Compose e API real. Depois de clicar em **Sair**, o CT-18 esperava a página inicial e encontrou a tela de login. O comportamento foi registrado na #298.

A suíte local passou em 29 casos. O CT-18 aguarda a #298, e os três casos mobile do CT-24 aguardam a #269. Os demais casos da #270 foram executados no projeto desktop.

O CT-19 também foi executado com uma falha simulada no cadastro. O teste reprovou ao não encontrar a confirmação de rascunho. A simulação foi removida.
