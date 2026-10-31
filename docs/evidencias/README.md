# Evidências dos PRs

Prints e conferências que acompanham os pull requests. Cada pasta tem um README.md que diz como as capturas foram feitas (mock ou API real, larguras, navegador) e o que foi validado.

## Como acrescentar

1. Crie `docs/evidencias/pr-<N>/` na branch do PR, com os PNGs e um README.md curto.
2. Tire pelo menos celular (375 ou 390 px) e desktop (1280 px); inclua estados de carregando, vazio e erro, ou antes e depois quando for correção.
3. No corpo do PR, use a URL raw fixada no SHA do commit dos prints (o [modelo de PR](../../.github/pull_request_template.md) traz o exemplo).
4. Acrescente uma linha na tabela abaixo, no milestone certo.

As pastas antigas `issue-<N>` foram nomeadas pela issue; as novas usam sempre o número do PR.

## Milestone 4

| Pasta | PR | Issue | Entrega | O que mostra |
|---|---|---|---|---|
| [pr-48](pr-48/README.md) | #48 | #40 | E4 | Home e Indicadores no desktop e no celular, mapeamento das telas do Stitch e origem dos logos |
| [pr-65](pr-65/README.md) | #65 | #12 | E3 | Front consumindo a API real pelo Docker Compose e a resposta de `/api/indicadores/destaques` |

## Milestone 5

| Pasta | PR | Issue | Entrega | O que mostra |
|---|---|---|---|---|
| [pr-118](pr-118/README.md) | #118 | #109 | E9 | Filtros nos serviços e mocks com a carga de 6 setores |
| [pr-119](pr-119/README.md) | #119 | #110 | E9 | `FiltrosPainel` com filtros na URL, teclado, celular e comparação com o Stitch |
| [pr-130](pr-130/README.md) | #130 | #94 | E7 | Rótulos do comparativo anual antes e depois da correção em 320, 360 e 1280 px |
| [issue-111](issue-111/README.md) | #133 | #111 | E9 | Página de Indicadores com filtros, coluna Setor e estado sem dados |
| [issue-112](issue-112/README.md) | #134 | #112 | E9 | Home com os 4 destaques do mockup |
| [issue-113](issue-113/README.md) | #140 | #113 | E10 | Link "Acesso Administrativo" no cabeçalho e tela de login |
| [issue-76](issue-76/README.md) | #143 | #76 | E8 | Integração completa com a API real: filtros, cards, gráficos e login |

## Milestone 6

| Pasta | PR | Issue | Entrega | O que mostra |
|---|---|---|---|---|
| [pr-196](pr-196/README.md) | #196 | #190 | E18 | Responsividade das páginas públicas em 375, 768 e 1280 px |
| [pr-197](pr-197/README.md) | #197 | #176 | E18 | Ajuste final da identidade visual, antes e depois |
| [pr-199](pr-199/README.md) | #199 | #186 | E15 | Serviços e mocks de relatórios (testes, sem tela) |
| [pr-203](pr-203/README.md) | #203 | #187 | E15 | Página pública de relatórios e estados de carregando, vazio e erro |
| [pr-207](pr-207/README.md) | #207 | #188 | E15 | Filtros de ano e categoria na página de relatórios, na URL, em 375, 768 e 1280 px |
| [pr-218](pr-218/README.md) | #218 | #176 | E18 | Capa da Home com foto da cidade, novo login e logos verticais do rodapé, antes e depois |
| [pr-220](pr-220/README.md) | #220 | #180 | E11 | Painel de gestão com contadores, filtros e selos de status, com a API real, em 375 e 1280 px |
| [pr-221](pr-221/README.md) | #221 | #181 | E12 | Cadastro e edição de medições: indicador novo, `409` de duplicada, rascunho e publicada só leitura, com a API real, em 375 e 1280 px |
| [pr-222](pr-222/README.md) | #222 | #182 | E14 | Upload de relatórios no painel: validação de PDF e tamanho, `400` da API, envio como rascunho e lista, com a API real, em 375 e 1280 px |
| [pr-223](pr-223/README.md) | #223 | | E18 | Telas 6, 7 e 8 com o cabeçalho e o CSS comuns do painel, incluindo estados de erro, em 375 e 1280 px |
| [pr-225](pr-225/README.md) | #225 | #189 | E16 | Download dos PDFs públicos, pedido em andamento e erro no card, em 375 e 1280 px |
| [pr-226](pr-226/README.md) | #226 | #174 | E13 | Publicar e despublicar medições na Tela 6: antes e depois, diálogo de confirmação, sucesso e perfil editor, com mock, em 375 e 1280 px |
| [pr-227](pr-227/README.md) | #227 | #175 | E13 | Publicar e despublicar relatórios na Tela 8: antes e depois, confirmação, sucesso e perfil editor, mais o foco e a mensagem da Tela 6, com mock, em 375 e 1280 px |
