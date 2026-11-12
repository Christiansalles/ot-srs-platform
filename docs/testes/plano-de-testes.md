# Plano de testes

Plano de testes do Milestone 7 (E19). Diz o que se testa, em que nível, quem testa a parte de quem, os casos de cada fluxo (`CT-01`, `CT-02`...), quando os testes contam como prontos e como reportar um bug.

Os testes de ponta a ponta (#256, #260, #264, #270) e a acessibilidade (#258, #259) usam os ids daqui. Quem escreve um teste põe o id no nome, por exemplo `test('CT-06: filtrar 2024 muda leitos para 312', ...)`, e quem abre um bug cita o id no modelo de bug.

Cada pessoa revisa os casos da própria área (coluna "Revisa os casos" do [rodízio](#rodízio)). Caso novo entra por PR neste arquivo, com o próximo número livre. Um id nunca é reaproveitado.

## Níveis de teste

| Nível | Ferramenta | O que cobre | Onde fica | Como rodar | Quando roda |
|---|---|---|---|---|---|
| Unidade (back) | Jest | Serviços e funções puras: senha, filtros, variação percentual, nome do arquivo do PDF | `backend/tests/*.test.js` | `cd backend && npm test` | Todo PR, no CI (`ci.yml`) |
| Unidade (front) | Vitest e Testing Library | Componentes, páginas com a API simulada, `utils/`, `services/`, o padrão visual | `frontend/src/__tests__/` | `cd frontend && npm test` | Todo PR, no CI (`ci.yml`) |
| API | Jest e Supertest, com PostgreSQL de verdade | Rotas, códigos de erro do [contrato](../contrato-api.md), perfis, rascunho fora das rotas públicas | `backend/tests/*.test.js` | `cd backend && npm test` (com o banco de pé) | Todo PR, no CI (`ci.yml`) |
| Ponta a ponta | Playwright, no desktop (1280 px) e no celular (390 px) | Fluxos inteiros no navegador, contra o sistema do Docker Compose | `e2e/testes/*.spec.js` | Seção "Testes de ponta a ponta" do [README](../../README.md) | Todo PR, no CI (job `compose`) |
| Acessibilidade automática | `@axe-core/playwright` dentro do E2E | Violações `serious` e `critical` em cada tela | `e2e/testes/acessibilidade.spec.js` (#259) | Junto com o E2E | Todo PR, no CI (job `compose`) |
| Acessibilidade manual | Teclado, leitor de tela, medidor de contraste | O que o axe não pega: ordem do foco, textos dos gráficos, mensagens anunciadas | [Auditoria de acessibilidade](#auditoria-de-acessibilidade), abaixo | À mão | Uma vez no M7 (#258) e depois de cada correção |
| Exploratório | Celular de verdade, sem roteiro fechado | Toque, teclado do celular, rede lenta, download do PDF no aparelho | [Rodízio](#rodízio) e [lista de bugs](#lista-de-bugs) | À mão, com o sistema acessível pela rede local | Uma rodada antes da triagem (#244) |

**Situação em 10/11:** unidade, API e E2E rodam no CI em todo PR. A base do E2E (#240) já está na `develop`, com o teste de fumaça da Home (CT-01) e os testes dos ajudantes. Os casos de relatórios públicos (CT-11 a CT-15) estão em `e2e/testes/relatorios.spec.js` (#260), e o axe em cada tela (CT-35) está em `e2e/testes/acessibilidade.spec.js` (#259). Os outros casos `E2E` automáticos deste plano são o roteiro que as issues #256, #264 e #270 vão escrever.

O que cada nível **não** faz:

- Teste de unidade e de API não abre o navegador. Se o bug só aparece na tela, ele vira caso E2E.
- O E2E não repete o que a API já cobre caso a caso, como cada `400` dos filtros ou a sexta tentativa de login. Ele confere o fluxo que a pessoa faz na tela.
- O axe não substitui a auditoria manual: ele não sabe se a ordem do foco faz sentido nem se o gráfico tem resumo em texto.

## Ambiente e dados

- **Sistema:** `docker compose -p ot-e2e up --build -d`, como no README. O projeto `ot-e2e` tem banco próprio, então os dados criados pelos testes não caem no banco do dia a dia. Para recomeçar do zero: `docker compose -p ot-e2e down -v`.
- **Usuários:** o administrador e o editor de desenvolvimento do `docker-compose.yml` (`ADMIN_*` e `EDITOR_*`). No E2E, use `entrarComo(page, 'administrador' | 'editor')`. Nunca use senha real.
- **Valores esperados:** só os da carga (`backend/prisma/dados/*.json`). Os mais usados nos casos:

  | O que | Valor | Período |
  |---|---|---|
  | Número de leitos | 350 leitos (312 em 2024/2) | 2025/2 |
  | Fluxo de visitantes | 5.200 visitantes | 2025/2 |
  | Número de empresas | 120 empresas | 2025/2 |
  | Empregos no setor | 840 empregos | 2025/2 |
  | Períodos com dados | 2020/2 a 2025/2 (só segundo semestre) | |
  | Relatório OT-ILUS-01/2025 | "Indicadores do setor hoteleiro", Setor Hoteleiro, 21/10/2026, 193 KB | |
  | Relatório OT-ILUS-02/2025 | "Participação econômica do turismo", Impacto Econômico, 21/10/2026, 231 KB | |

- **Dados criados pelo teste:** sempre de **2031 em diante** (`PRIMEIRO_ANO_DE_TESTE` em `e2e/ajudantes/api.js`), um período que a carga não tem, com nome gerado por `nomeUnico()`. O valor da medição também vem da carga (por exemplo, 350). Assim nenhum teste muda o destaque, a variação ou os períodos que outro teste confere.
- **Ano sem dados:** 2019 (nenhuma medição na carga).

## Rodízio

Ninguém testa a própria parte. Quem escreveu o código revisa os casos da sua área, e outra pessoa escreve o E2E e faz o exploratório.

| Área | Quem fez | Revisa os casos | Escreve o E2E | Exploratório no celular |
|---|---|---|---|---|
| Portal público: Home, Indicadores, Dashboard, filtros, 404 | Samuel (Telas 1 e 3, filtros, 404, menu), Karolina (cards e gráficos), Giovana e Christian (API) | Samuel e Karolina | Maria Clara (#264) | Giovana |
| Relatórios públicos e download | Samuel (Tela 4 e download), Christian e Giovana (API) | Samuel | Karolina (#260) | Maria Clara |
| Painel: login, cadastro, duplicada, edição, upload | Maria Clara (Telas 5, 6, 7 e 8), Giovana (API de cadastro e upload) | Maria Clara e Giovana | Samuel (#270) | Karolina |
| Publicação, perfis e usuários | Christian (perfis, status e API de usuários), Karolina (botões de publicar), Maria Clara (Tela Usuários) | Christian | Giovana (#256) | Samuel |
| Acessibilidade de todas as telas | Cada pessoa nas suas telas | Cada pessoa nas suas telas | Karolina (#259) | Karolina (#258) |

Christian revisa este plano, faz a triagem (#244) e conduz a integração (#245).

## Casos de teste

Coluna **Nível:** `E2E` (Playwright), `API` (Jest e Supertest), `A11y` (axe ou manual), `Manual` (exploratório). Coluna **Issue:** onde o caso vira teste. Os casos marcados com "depende de" só passam depois que a issue indicada estiver mergeada. Até lá, o teste fica com `test.fixme` e o motivo no comentário.

### Portal público

| Id | Nível | Passos | Resultado esperado | Issue |
|---|---|---|---|---|
| CT-01 | E2E | Abrir `/`. | Quatro cards em destaque, nesta ordem: Número de leitos 350, Fluxo de visitantes 5.200, Número de empresas 120, Empregos no setor 840, todos de 2025/2. | #240 (fumaça), #264 |
| CT-02 | E2E | Na Home, usar o menu para ir a Indicadores, Dashboard e Relatórios. No celular, abrir o menu primeiro. | Cada item abre a página certa. No celular, o menu abre e fecha e não quebra em duas linhas. Depende de #267. | #264 |
| CT-03 | E2E | Abrir `/indicadores`. | Tabela com indicador, setor, unidade, ano e valor da carga. No celular, nenhuma coluna fica cortada. Depende de #268 no celular. | #264 |
| CT-04 | E2E | Em `/indicadores`, filtrar o setor Hospedagem e o ano 2024; recarregar a página. | A tabela mostra só Hospedagem em 2024 (leitos 312). Os filtros aparecem na URL e continuam depois de recarregar. | #264 |
| CT-05 | E2E | Abrir `/dashboard`. | Cards, gráficos de série histórica, distribuição por setor e comparativo anual, e o texto "Atualizado em dd/mm/aaaa". Depende de #255 para o "Atualizado em". | #264 |
| CT-06 | E2E | No dashboard, filtrar o ano 2024. | O card de leitos passa a mostrar 312 (2024/2). O filtro fica na URL. | #264 |
| CT-07 | E2E | Abrir o dashboard e `/indicadores` com o ano 2019 na URL. | Estado vazio com a mensagem de "sem dados", sem card com número e sem erro. | #264 |
| CT-08 | E2E | Abrir `/qualquer-coisa`. | Página 404 com header, rodapé e link para a Home. Depende de #266. | #264 |
| CT-09 | E2E | Pela API, criar uma medição de 2031/1 (rascunho). Abrir a Home, `/indicadores` e `/dashboard`. | Nada de 2031 aparece em nenhuma tela pública, nem no filtro de ano. | #240 (pela API), #264 |
| CT-10 | API | `GET` em todas as rotas públicas com uma medição e um relatório em rascunho no banco. | Nenhuma resposta traz o rascunho, nem em contagem, destaque, período ou download. | `backend/tests/publicas.rascunho.test.js` |

### Relatórios públicos e download

| Id | Nível | Passos | Resultado esperado | Issue |
|---|---|---|---|---|
| CT-11 | E2E | Abrir `/relatorios`. | Os dois relatórios da carga, "Participação econômica do turismo" primeiro, cada um com título, edição, categoria, data (21/10/2026) e tamanho (231 KB e 193 KB). | #260 |
| CT-12 | E2E | Filtrar a categoria Setor Hoteleiro; depois o ano 2026; recarregar. | Só "Indicadores do setor hoteleiro". Os filtros ficam na URL e continuam depois de recarregar. | #260 |
| CT-13 | E2E | Abrir `/relatorios?ano=2025`, um ano de publicação sem relatório (o seletor só oferece anos com relatório, então o caso entra pela URL). | Mensagem "Nenhum relatório publicado para esse filtro". | #260 |
| CT-14 | E2E | Em "Indicadores do setor hoteleiro", clicar em "Baixar PDF". | Baixa um `application/pdf` chamado `ot-ilus-01-2025-indicadores-do-setor-hoteleiro.pdf` (evento `download` do Playwright). | #260 |
| CT-15 | E2E | Como administrador, subir um PDF sem publicar. Abrir `/relatorios` e chamar o download dele pela URL. | O relatório não aparece na lista, e o download responde `404`. | #260 |

### Painel: login, cadastro, edição e upload

| Id | Nível | Passos | Resultado esperado | Issue |
|---|---|---|---|---|
| CT-16 | E2E | Em `/admin/login`, entrar com a senha errada. | Mensagem "E-mail ou senha inválidos", e continua na tela de login. | #270 |
| CT-17 | E2E | Sem login, abrir `/admin`. | Vai para `/admin/login`. | #270 |
| CT-18 | E2E | Entrar e clicar em "Sair". | Volta ao portal. Abrir `/admin` de novo leva ao login. | #270 |
| CT-19 | E2E | Entrar e cadastrar uma medição de 2031/1 num indicador criado para o teste. | A medição aparece na Tela 6 como "Rascunho". | #270 |
| CT-20 | E2E | Cadastrar de novo o mesmo indicador em 2031/1. | Erro "Já existe uma medição deste indicador em 2031/1", e o formulário continua preenchido. | #270 |
| CT-21 | E2E | Editar o valor de uma medição em rascunho. | O valor novo aparece na lista. | #270 |
| CT-22 | E2E | Em uma medição publicada, clicar em "Editar", mudar o valor e salvar. | Nada muda: a tela mostra "Despublique a medição antes de editar", e o valor publicado continua no portal. | #270 |
| CT-23 | E2E | Na Tela 8, subir um PDF; depois, tentar subir um arquivo que não é PDF. | O PDF vira um relatório em rascunho. O outro arquivo mostra "Arquivo PDF obrigatório". | #270 |
| CT-24 | E2E | Repetir CT-16, CT-19 e CT-23 no projeto `celular`. | Mesmo resultado, sem nada cortado nem botão inalcançável. Depende de #269. | #270 |
| CT-25 | API | Errar a senha `LOGIN_MAX_TENTATIVAS` vezes e tentar de novo com a senha certa. | `429` com `Retry-After` e a mensagem do contrato; outras rotas continuam sem limite. Não entra no E2E, porque bloquearia os outros testes. Depende de #108. | #108 |

### Publicação, perfis e usuários

| Id | Nível | Passos | Resultado esperado | Issue |
|---|---|---|---|---|
| CT-26 | E2E | Como administrador, cadastrar uma medição de 2031/1 e publicar. Abrir o dashboard e `/indicadores` com 2031. Voltar e despublicar. | Publicada, aparece no portal; despublicada, some. | #256 |
| CT-27 | E2E | Como administrador, subir um PDF e publicar. Abrir `/relatorios`. Despublicar. | Publicado, aparece na lista e baixa; despublicado, some e o download dá `404`. | #256 |
| CT-28 | E2E | Entrar como editor e cadastrar uma medição. | Fica em rascunho. Os botões de publicar e despublicar não aparecem, nem o menu Usuários. | #256 |
| CT-29 | E2E | Como editor, digitar `/admin/usuarios`. | A tela de usuários não abre; volta para o painel. Depende de #263. | #256 |
| CT-30 | API | Como editor, chamar `PATCH /api/admin/medicoes/:id/status` e `PATCH /api/admin/relatorios/:id/status`. | `403` com "Seu perfil não pode publicar conteúdo". | `backend/tests/admin.status.test.js` |
| CT-31 | E2E | Como administrador, criar um editor na tela Usuários, sair, entrar com ele. Voltar como administrador, desativar o editor e tentar entrar com ele de novo. | O editor novo entra; depois de desativado, recebe "E-mail ou senha inválidos". Depende de #243 e #263. | #256 |
| CT-32 | E2E | Na tela Usuários, criar um usuário com um e-mail que já existe. | Erro "Já existe um usuário com este e-mail", sem apagar o formulário. Depende de #263. | #263 |
| CT-33 | API | Como administrador, desativar o próprio usuário ou trocar o próprio perfil para editor. | `409` com "Você não pode desativar nem rebaixar o próprio usuário". Depende de #243. | #243 |
| CT-34 | E2E | Editar uma medição e abrir a Tela 6 e o dashboard. | A Tela 6 mostra "Atualizado em" com a data de hoje e "Lançado por" com quem cadastrou; o dashboard só muda a data depois de publicar. Depende de #255. | #255 |

### Acessibilidade

| Id | Nível | Passos | Resultado esperado | Issue |
|---|---|---|---|---|
| CT-35 | A11y | Rodar o axe em cada tela pública e do painel (como administrador). | Nenhuma violação `serious` ou `critical`, fora as da lista de exceções, cada uma com o número do bug. | #259 |
| CT-36 | A11y | Navegar cada tela só com o teclado (Tab, Shift+Tab, Enter, Esc), inclusive o menu do celular e os filtros. | Tudo alcançável, na ordem da leitura, com o foco visível. | #258 |
| CT-37 | A11y | Conferir rótulos, títulos, imagens e mensagens em cada tela. | `label` em todo campo, `aria-label` em botão só com ícone, um `h1` por página, títulos em ordem, `alt` nas imagens, `lang="pt-BR"`, erro e sucesso anunciados. | #258 |
| CT-38 | A11y | Medir o contraste do texto, principalmente sobre o gradiente e a paleta. | Pelo menos 4,5:1 (WCAG AA) no texto normal. | #258 |

### Exploratório

| Id | Nível | Passos | Resultado esperado | Issue |
|---|---|---|---|---|
| CT-39 | Manual | Num celular de verdade, na mesma rede do computador que roda o compose: navegar o portal, usar os filtros, baixar um PDF e, no painel, entrar e cadastrar uma medição de 2031. Anotar aparelho e navegador. | Nada cortado, nada que só funciona com mouse, PDF abre no aparelho. Cada problema vira bug com o id CT-39. | Rodízio |

Para abrir o sistema no celular, o front precisa ser construído apontando para o IP do computador (`VITE_API_URL=http://<ip-do-computador>:3000 docker compose -p ot-e2e up --build -d`), e o celular abre `http://<ip-do-computador>:8080`.

## Critério de pronto

Os testes do M7 contam como prontos quando:

1. Cada caso `E2E` e `A11y` automático deste plano existe em `e2e/testes/`, com o id no nome, e passa no job `compose` do CI nos dois projetos (desktop e celular).
2. Caso que falha por bug conhecido fica com `test.fixme`, e o comentário traz o número da issue do bug. Nenhum teste é apagado nem afrouxado para passar.
3. Antes de abrir o PR, quem escreveu o teste quebrou de propósito o que ele confere e viu o teste falhar.
4. Os casos `API` estão nos testes do backend e passam no CI.
5. O exploratório (CT-39) e a auditoria manual (CT-36 a CT-38) foram feitos, e cada achado virou bug.
6. Nenhum bug `Urgent` está aberto, e os outros estão triados, com responsável e prazo (#244).
7. A cobertura de linhas do backend e do frontend não ficou abaixo da [linha de base](#cobertura).

## Como reportar um bug

1. Confira no quadro se ele já foi registrado.
2. Abra pelo modelo **Bug** (Issues → New issue → Bug), que põe o rótulo `bug`. Preencha como reproduzir, esperado, aconteceu, onde (tela, tamanho, navegador), print e o id do caso (`CT-xx`) ou o teste que falhou. Problema de acessibilidade leva também o rótulo `accessibility`.
3. Se veio de um E2E, marque o caso com `test.fixme` e o número da issue no comentário.
4. A triagem (#244) confere que reproduz, dá a prioridade, atribui a quem fez a parte e define o prazo:
   - **Urgent:** quebra um fluxo principal ou mostra rascunho no portal. É triado no mesmo dia em que chega.
   - **Normal:** o resto.
5. A triagem mantém a [lista de bugs](#lista-de-bugs) abaixo, que vai para o relatório do M7.

### Lista de bugs

| Issue | Caso | Onde | Prioridade | Quem corrige | Status |
|---|---|---|---|---|---|
| #282 | CT-37 (A-1) | Todas as telas, título da aba | Normal | Karolina | Corrigido no #300 |
| #283 | CT-36 (A-2) | Portal, falta "Pular para o conteúdo" | Normal | Karolina | Aberto |
| #284 | CT-35, CT-38 (A-3) | Indicadores, cabeçalho da tabela | Normal | Samuel | Corrigido no #297 |
| #285 | CT-35, CT-38 (A-4) | Login, nome do departamento | Normal | Maria Clara | Aberto |
| #298 | CT-18 | Painel, Sair leva ao login em vez da página inicial | Normal | Karolina | Aberto |

**Triagem da #298 (12/11):** prioridade Normal (`Medium` no quadro), correção com Karolina e prazo em 13/11/2026, no M7. A sessão é encerrada, mas o destino contraria o CT-18. O teste permanece com `test.fixme` até corrigir o redirecionamento, ajustar o teste unitário que hoje espera o login e reativar o E2E. Os prazos anteriores da triagem eram de 10/11; este bug foi aberto em 12/11.

## Cobertura

A cobertura mostra o que nenhum teste executa. Ela não é meta por si só: 100% de linhas não garante que o teste confere alguma coisa.

Backend (precisa do banco de pé, como no `npm test`):

```bash
cd backend
npm run test:cobertura
```

Frontend:

```bash
cd frontend
npm run test:cobertura
```

Os dois scripts rodam `jest --runInBand --coverage` e `vitest run --coverage` (este com o `@vitest/coverage-v8`). O resumo aparece no terminal, e o relatório detalhado fica em `backend/coverage/` e `frontend/coverage/`: abra o `lcov-report/index.html` (backend) ou o `index.html` (frontend) no navegador. As pastas `coverage/` estão no `.gitignore`.

### Linha de base

Medida em 03/11/2026, na `develop` em `1a288ce`, com o banco recém-criado pelo `db:setup`:

| Parte | Linhas | Instruções | Ramos | Funções |
|---|---|---|---|---|
| Backend (Jest, 231 testes) | 94,81% | 90,32% | 84,23% | 92,59% |
| Frontend (Vitest, 319 testes) | 94,28% | 91,25% | 87,66% | 95,13% |

Meça de novo no fim do M7 e anote aqui, ao lado.

## Auditoria de acessibilidade

Preenchida na #258, tela por tela. "Ok" quando passou; senão, onde a correção está: `#261` quando a parte é da Karolina, `A-n` quando é um achado de outra pessoa que vira bug (lista abaixo).

**Como foi feita (04/11/2026, `develop` em `8198b19`):** front com `VITE_USE_MOCK=true`, no Chrome, em 1280 e 390 px. No painel, a sessão de administrador foi simulada. Em cada tela:

- axe-core 4.10 com as regras WCAG 2.1 A e AA e as boas práticas;
- Tab do começo ao fim da página, anotando cada parada e se o foco aparece;
- `lang`, título da aba, `h1`, ordem dos títulos, `alt` e mensagens com `role="alert"`, `role="status"` ou `aria-live`;
- contraste sobre foto e gradiente (capa da Home, painel de marca do Login, botões e avatar), que o axe não mede: o texto é escondido, o fundo é capturado e o contraste é calculado no percentil 5 dos pixels atrás do texto.

Não foi usado leitor de tela de verdade (NVDA ou TalkBack): o que é anunciado foi conferido pelos papéis no código e no DOM.

| Tela | Teclado (CT-36) | Rótulos e títulos (CT-37) | Contraste (CT-38) | axe (CT-35) | Observações |
|---|---|---|---|---|---|
| Home (`/`) | A-2 | A-1 | #261 | #261 | Capa sobre a foto passa: título 7:1, texto 6,4:1, botões 4,5:1. Falha a variação dos cards (3,74:1). |
| Indicadores | A-2 | A-1 | A-3 | A-3 | Filtros e tabela alcançáveis, com foco visível; a tabela rola com o teclado. |
| Dashboard | #261 | #261 | #261 | #261 | Os três gráficos recebem Tab como `role="application"` sem nome; a rosca fica dentro de `aria-hidden` e continua focável. Série histórica e comparativo não têm resumo dos dados em texto (a distribuição tem a lista com os percentuais). |
| Relatórios | A-2 | A-1 | Ok | Ok | Filtros, "Limpar filtros" e "Baixar PDF" com nome do relatório; vazio e erro anunciados. |
| 404 | | | | | Ainda não existe (#266). Hoje uma URL inexistente mostra a página em branco. |
| Login | Ok | A-1 | #261, A-4 | #261, A-4 | "Mostrar senha" funciona com Enter. No painel de marca, "Ambiente seguro" e o rodapé ficam em 3,3:1 sobre a foto, e "Voltar ao portal" em 4,4:1. O `h1` é o logo, com `alt`. |
| Tela 6 (painel) | #261 | Ok | Ok | Ok | No celular, com o menu aberto, o Tab vai para "Sair" e para o conteúdo e não passa pelos links do menu. Esc fecha e devolve o foco ao botão. Sem "Pular para o conteúdo". |
| Tela 7 (cadastro de medição) | #261 | Ok | Ok | Ok | Mesmo problema do menu da Tela 6. Campos com `label` e erros com `role="alert"`. |
| Tela 8 (relatórios no painel) | #261 | Ok | Ok | Ok | Mesmo problema do menu da Tela 6. A área de upload recebe foco e o campo de data mostra o foco em cada parte. |
| Usuários | | | | | Ainda não existe (#263). |

Em todas as telas: `lang="pt-BR"`, um `h1`, títulos sem pular nível, nenhuma imagem sem `alt` e nenhum elemento focável sem foco visível.

### Achados da auditoria

Os achados `A-n` são de telas de outras pessoas e viram bug com os rótulos `bug` e `accessibility`; o número da issue entra aqui e na [lista de bugs](#lista-de-bugs). Os da Karolina são corrigidos na #261.

| Achado | Onde | O que acontece | Esperado | Quem fez a parte | Bug |
|---|---|---|---|---|---|
| A-1 | Todas as telas (`frontend/index.html`) | O título da aba é sempre "Observatório do Turismo de Santa Rita do Sapucaí". | Cada página com o próprio título, por exemplo "Relatórios · Observatório do Turismo" (WCAG 2.4.2). | Global, a triagem decide | #282 |
| A-2 | Portal público (`AppLayout` em `App.jsx`) | Não há "Pular para o conteúdo": quem usa teclado passa pelos 5 links do cabeçalho em toda página. | Um link "Pular para o conteúdo" como primeira parada do Tab, levando ao `main` (WCAG 2.4.1). | Samuel | #283 |
| A-3 | Indicadores, cabeçalho da tabela | Texto `--color-text-muted` sobre `--color-surface-muted`: 4,34:1. | Pelo menos 4,5:1. | Samuel | #284 |
| A-4 | Login, nome do departamento no rodapé do cartão | `.admin-login-department` em `--color-text-muted` sobre o fundo azul claro: 4,27:1. | Pelo menos 4,5:1. | Maria Clara | #285 |

Na #261 (Karolina): a variação dos cards (`--color-success`, 3,74:1), os gráficos do Dashboard (nome, `aria-hidden` com foco e resumo em texto), o painel de marca e "Voltar ao portal" do Login, e no `AdminLayout` o Tab do menu do celular e o "Pular para o conteúdo" do painel.
