> Cópia do `Milestone4_Tarefas/00_Visao_Geral_M4.md`, mantido fora do repositório pelo grupo. Os caminhos `Stitch/Image N.html` correspondem aos arquivos de [`docs/referencias/stitch/`](../referencias/stitch/README.md), e `docs/pr-N` agora é `docs/evidencias/pr-N`. Os arquivos individuais citados aqui não foram copiados.

# Milestone 4: visão geral do grupo

**Entrega:** sexta, 02/10, assíncrona (o professor avalia sem a gente na frente).
**Meta:** 25% do projeto, ou seja, as entregas E1 a E5 prontas.
**Fatia:** indicadores de hospedagem funcionando de ponta a ponta: banco, API e tela.

Cada um tem um arquivo próprio nesta pasta com as suas tarefas. Este aqui vale para todos.

---

## As 5 entregas deste Milestone

| Entrega | O que é | Responsável | Revisor do PR |
|---|---|---|---|
| E1 | Ambiente e organização (Docker, README, CI, quadro de tarefas) | Maria Clara e Christian | um revisa o do outro |
| E2 | Banco de dados e carga de hospedagem | Giovana | Christian |
| E3 | API de consulta dos indicadores | Christian e Maria Clara | Giovana / Maria Clara |
| E4 | Página inicial e página de Indicadores (Telas 1 e 3) | Samuel | Karolina |
| E5 | Primeiro card e primeiro gráfico do dashboard (Tela 2) | Karolina | Samuel |

## Regra de "pronto" (vale para todas)

Uma entrega só conta como implementada quando:

1. O código está na `main`: o PR da tarefa foi revisado por outra pessoa e mergeado na `develop`, e a `develop` foi levada para a `main` numa versão validada;
2. Os testes automatizados dela existem e passam no CI;
3. Roda com `docker compose up --build`, sem passo manual escondido;
4. Quem abriu o PR sabe explicar o que o código faz (vale principalmente para código gerado por IA).

Testes são feitos **junto** com a funcionalidade, não depois.

## Como ler as dependências

Em cada arquivo individual, toda tarefa tem uma etiqueta:

- **[livre]**: pode começar já, não espera ninguém.
- **[depende de: Fulano, o quê]**: só dá para fazer ou terminar depois que Fulano entregar aquilo. Enquanto isso, adiante com dado falso (mock) ou pegue outra tarefa.
- **[bloqueia: Fulano]**: tem gente esperando por isso. Prioridade máxima, e avise no grupo quando mergear.

## Mapa de dependências

| Quem entrega | O quê | Até | Quem está esperando |
|---|---|---|---|
| Christian | Esqueleto do repositório (backend e frontend já rodando `npm test`) | Qui 24/09 | **Todos** |
| Samuel | `services/api.js` + mocks no formato do contrato | Sex 25/09 | Karolina |
| Karolina | Tema visual (cores, fonte, gradiente) | Sex 25/09 | Samuel |
| Karolina | Componente `CardIndicador` | Sáb 26/09 | Samuel (Home) |
| Samuel | Rotas do front, incluindo `/dashboard` | Sáb 26/09 | Karolina |
| Maria Clara | Express base (`app.js`, erros, CORS, Supertest) | Sex 25/09 | Christian |
| Giovana | Schema + migração na `main` | Sex 25/09 | Christian, Maria Clara (Docker) |
| Giovana | Carga de hospedagem (seed) | Seg 28/09 | Christian, Maria Clara, Samuel, Karolina |
| Christian | Rotas da API | Seg 28/09 | Samuel, Karolina (integração de terça) |
| Todos | Tudo mergeado | Qua 30/09 | Maria Clara (teste em máquina limpa) |
| Todos | Gravação da própria parte do vídeo | Qui 01/10, 12h | Karolina (edição) |
| Karolina | Vídeo editado | Qui 01/10, noite | Christian (entrega) |

O caminho crítico é: **esqueleto → schema → carga → API → integração**. Se qualquer um desses atrasar, o grupo inteiro atrasa, então quem está nele avisa cedo.

## Calendário

| Dia | O que precisa acontecer |
|---|---|
| Qui 24/09 | Reunião curta de início. Christian sobe o esqueleto do repositório e as tarefas no GitHub (issues #2 a #43 e quadro no GitHub Projects). Samuel começa a base do front. |
| Sex 25/09 | Giovana: schema e migração na `main`. Maria Clara: Express base. Karolina: tema visual. Samuel: `services/api.js` e mocks. Christian: CI. |
| Sáb 26 e Dom 27 | Giovana: carga de hospedagem. Christian: rotas da API. Front segue com dados falsos (mock). |
| Seg 28/09 | **API respondendo com os dados da carga** (E2 e E3 prontas). |
| Ter 29/09 | **Integração:** o front troca o mock pela API de verdade. |
| Qua 30/09 | **Congelamento:** tudo mergeado. Alguém clona o repositório do zero e segue o README numa máquina limpa. |
| Qui 01/10 | Gravação do vídeo e fechamento do relatório. |
| Sex 02/10 | Entrega. |

Travou? Avise no grupo no mesmo dia, não na véspera. Quem terminar antes ajuda quem está atolado.

## Estrutura do repositório

```
ot-srs-platform/
├── backend/
│   ├── prisma/          schema.prisma, migrations/, seed.js, dados/hospedagem.json
│   ├── src/             app.js, server.js, routes/, services/
│   ├── tests/           testes Jest + Supertest
│   └── Dockerfile
├── frontend/
│   ├── src/             components/, pages/, services/api.js, mocks/, theme/
│   ├── src/__tests__/   testes Vitest + React Testing Library
│   └── Dockerfile
├── .github/workflows/ci.yml
├── docker-compose.yml
└── README.md
```

## Git

O detalhe está em `docs/fluxo-de-trabalho.md`, no repositório. Resumo:

- Duas branches fixas, as duas protegidas (PR com 1 aprovação e CI verde, sem push direto):
  - `develop`: branch padrão do repositório. Toda branch de tarefa sai dela e o PR volta para ela.
  - `main`: só recebe versões validadas, por PR `develop → main`. É o que o professor avalia, e o link da entrega aponta direto para ela (`.../tree/main`).
- Uma branch por tarefa, no padrão `tipo/Entrega-issue-descricao`: `feat/E2-18-schema`, `feat/E3-8-rotas-indicadores`, `fix/...`, `test/...`. O número é o da issue no quadro.
- CI (`.github/workflows/ci.yml`) roda em todo PR: job `backend` (Jest, com Postgres) e job `frontend` (lint, Vitest e build).
- PR pequeno é revisado rápido. PR de 2 mil linhas não é revisado de verdade.
- Na descrição do PR: o que faz, como testar e `Closes #N` da issue. Uso de IA não precisa ser anotado no PR nem nos commits.

## Contrato da API (o front programa contra isso desde o primeiro dia)

Se o contrato fechado no Milestone III for diferente, vale o do Milestone III.
Só aparece conteúdo com `status = 'publicado'`.

```
GET /api/health
→ { "status": "ok" }

GET /api/setores
→ [ { "id": 1, "nome": "Hospedagem" } ]

GET /api/periodos
→ [ { "id": 1, "ano": 2025, "semestre": 1 } ]

GET /api/indicadores?setor=1
→ [ {
      "id": 3, "nome": "Leitos", "unidade": "leitos",
      "setor": { "id": 1, "nome": "Hospedagem" },
      "medicoes": [ { "ano": 2024, "semestre": 2, "valor": 1234 },
                    { "ano": 2025, "semestre": 1, "valor": 1280 } ]
    } ]

GET /api/indicadores/destaques
→ [ { "id": 3, "nome": "Leitos", "unidade": "leitos",
      "valor": 1280, "periodo": { "ano": 2025, "semestre": 1 },
      "variacao_percentual": 3.7 } ]
```

Os números acima são só exemplo de formato. Os da carga vêm dos mockups do Milestone III no Stitch (veja "Fonte dos dados" abaixo).
A variação percentual é calculada na consulta (período atual contra o anterior), não é guardada no banco.

## Fonte dos dados e identidade visual

O Relatório OT nº 004/2025 não está disponível para o grupo. Ele só aparece na proposta da Prefeitura como referência da identidade visual, e provavelmente é interno. As duas bases do Milestone 4 são:

- **Identidade visual:** `Proposta_Prefeitura_SRS_Inatel.pdf`.
  - Página 6: gradiente `#0A4AAD → #6C5CE0 → #C750D6` só nos destaques (capa, cabeçalhos, botões primários), paleta dos gráficos `#5FE6E0`, `#6C5CE0`, `#27B7FD`, `#B986ED`, `#F3B8F7`, `#FADA77`, e fundo claro no resto.
  - Página 7: os logos institucionais.
- **Números da carga:** os mockups do Milestone III no Stitch (pasta `Stitch/`), para banco, API e telas mostrarem os mesmos valores. São **dados ilustrativos**, e o `hospedagem.json` diz isso. Quando a SMCELT mandar os dados oficiais, só esse arquivo muda.

| Indicador | Período | Valor |
|---|---|---|
| Número de leitos | 2023/2 | 280 |
| Número de leitos | 2024/2 | 312 |
| Número de leitos | 2025/2 | 350 |
| Taxa de ocupação | 2025/2 | 68% |

Os mockups mostram leitos por ano. No banco, cada ano vira o 2º semestre, e 312 → 350 dá os +12% dos cards. A taxa de ocupação só tem 2025/2.

## Vídeo (cerca de 5 min, todos falam)

Cada um grava a própria parte com a tela compartilhada (OBS, Game Bar do Windows ou Loom). Karolina junta e edita. Christian sobe e libera o link.

| Tempo | Quem | O que mostra |
|---|---|---|
| 0:00 a 1:00 | Christian | O projeto em uma frase, o quadro de tarefas, um PR com revisão e o CI rodando |
| 1:00 a 2:00 | Maria Clara | `docker compose up --build` subindo tudo, README, `/api/health` e `/api/indicadores` no navegador |
| 2:00 a 3:00 | Giovana | Tabelas no Adminer, a carga de hospedagem, o teste da carga passando |
| 3:00 a 4:00 | Samuel | Home e página de Indicadores com os dados vindos da API, e o teste do front |
| 4:00 a 5:00 | Karolina | Card e gráfico do dashboard, e fechamento: o que vem no Milestone 5 |

Dica de áudio: gravem em lugar silencioso, com fone com microfone, e falem um pouco mais devagar do que o normal.

## Uso de IA (liberado pelo professor)

- Dê contexto: cole o trecho do DER, o contrato da API ou o HTML do mockup do Stitch. Sem contexto, a IA inventa.
- Peça sempre os testes junto com o código.
- Nunca cole senha, token ou `.env` na IA.
- Leia e rode antes de abrir o PR. "A IA fez" não é resposta se o professor perguntar.
- O uso de IA é contado no vídeo (cada um, na sua parte), não no PR nem nos commits. Isso também alimenta a seção 6 do relatório.
