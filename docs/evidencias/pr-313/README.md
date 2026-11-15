# Evidências do PR #313: rodapé ao trocar de aba

Capturas no Chrome headless (playwright-core), com `npm run dev` sem mock e as chamadas à API presas pelo Playwright, para a página ficar no estado de carregamento, que é quando o rodapé pulava. Só a área visível, em 390 x 844 e 1280 x 800 px. O antes usa o `App.css` da `develop` em `5d24ece`; o depois, o da branch.

| Arquivo | O que mostra |
|---|---|
| `antes-dashboard-390.png` | Dashboard carregando: o topo do rodapé aparece em 779 px, dentro da janela de 844 px |
| `antes-dashboard-1280.png` | Dashboard carregando: o rodapé aparece em 628 px, no meio da janela de 800 px |
| `depois-dashboard-390.png` | Dashboard carregando: o rodapé fica em 985 px, abaixo da janela |
| `depois-dashboard-1280.png` | Dashboard carregando: o rodapé fica em 945 px, abaixo da janela |

Na Home o rodapé já ficava abaixo da janela durante o carregamento (o banner ocupa a tela), então não há diferença para mostrar.
