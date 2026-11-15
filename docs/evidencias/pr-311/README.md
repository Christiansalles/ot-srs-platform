# Evidências do PR #311: correções de acessibilidade (#261)

Capturas com Docker Compose e a API real, no Chromium do Playwright, em 390 px (celular, escala 3) e 1280 px. O "antes" é da develop em `5d24ece`; o "depois", desta branch.

| Arquivo | O que mostra |
|---|---|
| `antes-login-1280.png`, `depois-login-1280.png` | Login: "Voltar ao portal", "Ambiente seguro", a citação e o rodapé do painel de marca. Contraste de 4,44:1, 3,96:1, 4,46:1 e 2,83:1 antes; de 9,43:1, 7,50:1, 7,69:1 e 7,70:1 depois |
| `antes-login-390.png`, `depois-login-390.png` | O mesmo no celular, onde a citação e o rodapé ficam escondidos. "Voltar ao portal" vai de 4,56:1 para 9,69:1 e "Ambiente seguro", de 3,85:1 para 7,00:1 |
| `antes-cards-1280.png`, `depois-cards-1280.png` | Variação dos cards do Dashboard: de `--color-success` (3,74:1) para `--color-success-strong` (5,47:1) |
| `antes-cards-390.png`, `depois-cards-390.png` | O mesmo no celular |
| `depois-pular-painel-1280.png` | Painel: o primeiro Tab mostra "Pular para o conteúdo" |

Os contrastes sobre a foto foram medidos com `e2e/ajudantes/contraste.js`, que esconde o texto, captura o fundo e usa o percentil 5, como a auditoria da #258.

O que não aparece em print fica nos testes: o nome e a tabela de dados dos gráficos para o leitor de tela, a rosca fora do Tab e o foco que entra no menu do painel ao abri-lo no celular (`e2e/testes/acessibilidade.spec.js`).
