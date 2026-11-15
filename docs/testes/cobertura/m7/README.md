# Extrato de cobertura do Milestone 7

Prova da cobertura de testes para o arquivo do Milestone 7 (#277). Os números saem das próprias ferramentas de teste: a cobertura nativa do **Jest** no backend (instrumentação do Istanbul) e a do **Vitest** com o `@vitest/coverage-v8` no frontend (cobertura do motor V8, com os reporters do Istanbul).

| | |
|---|---|
| Commit entregue | `main` em [`be59bd3`](https://github.com/Christiansalles/ot-srs-platform/commit/be59bd3ca70cad415ae58a960b70f3b719a3c4e6) (`be59bd3ca70cad415ae58a960b70f3b719a3c4e6`), o mesmo conteúdo da `develop` em `1d2247b` |
| Data da medição | 15/11/2026 |
| Execução do CI nesse commit | [CI #43752726559](https://github.com/Christiansalles/ot-srs-platform/actions/runs/43752726559) (backend e frontend) e [Docker Compose #43752726583](https://github.com/Christiansalles/ot-srs-platform/actions/runs/43752726583) (E2E) |
| Node | 24.12.0 na medição local; 24 no CI |
| Banco | PostgreSQL 18 do `docker-compose.yml`, recém-criado e com `npm run db:setup` |

## Resultado

| Parte | Testes | Linhas | Instruções | Ramos | Funções |
|---|---|---|---|---|---|
| Backend (Jest) | 303, em 26 arquivos | 95,26% (604/634) | 91,20% (664/728) | 85,90% (390/454) | 93,79% (121/129) |
| Frontend (Vitest) | 385, em 38 arquivos | 95,02% (1.012/1.065) | 91,92% (1.172/1.275) | 87,06% (909/1.044) | 95,46% (379/397) |

Ponta a ponta (Playwright, job `compose` da mesma execução): 128 casos, 114 passaram e 14 foram pulados por tamanho de tela. O E2E roda contra o sistema no Docker e não entra na medição de cobertura.

A cobertura de linhas ficou acima da [linha de base de 03/11](../../plano-de-testes.md#linha-de-base) nas duas partes (backend 94,81% → 95,26%; frontend 94,28% → 95,02%), como pede o critério 7 do plano.

## Arquivos

| Arquivo | O que é |
|---|---|
| [`backend.txt`](backend.txt) | Saída completa de `npm run test:cobertura` no backend: tabela por arquivo, resumo e total de testes |
| [`frontend.txt`](frontend.txt) | O mesmo para o frontend |
| [`backend-summary.json`](backend-summary.json) e [`frontend-summary.json`](frontend-summary.json) | O `coverage/coverage-summary.json` de cada parte (reporter `json-summary`) |
| [`backend-html.png`](backend-html.png) e [`frontend-html.png`](frontend-html.png) | Print da página inicial do relatório HTML (`backend/coverage/lcov-report/index.html` e `frontend/coverage/index.html`) |
| [`extrato-cobertura-m7.pdf`](extrato-cobertura-m7.pdf) | Uma página com os dois resumos, o SHA e o link do CI, para anexar ao arquivo do milestone |

Nos arquivos `.txt` e `.json`, o caminho absoluto da máquina foi trocado pelo caminho relativo ao repositório; os números não foram tocados. A largura da tabela do frontend vem de `maxCols: 200`, configurado neste PR para o nome dos arquivos não ser cortado.

## Como gerar de novo

```bash
git checkout be59bd3
docker compose up -d --wait db

cd backend
npm ci
npm run db:setup
npm run test:cobertura

cd ../frontend
npm ci
npm run test:cobertura
```

O backend precisa do `backend/.env` (copie do `.env.example`). Se outro PostgreSQL já usa a porta 5432, suba o banco com `POSTGRES_PORT=5433` e ajuste a `DATABASE_URL`. Os números saem iguais aos de cima: a medição foi repetida duas vezes no mesmo banco, com o mesmo resultado.

No `be59bd3`, os scripts ainda usam os reporters padrão. Para gerar também o `json-summary`, passe os reporters na linha de comando:

```bash
npm run test:cobertura -- --coverageReporters=text --coverageReporters=text-summary --coverageReporters=lcov --coverageReporters=json-summary
```

```bash
npm run test:cobertura -- --coverage.reporter=text --coverage.reporter=text-summary --coverage.reporter=html --coverage.reporter=json-summary
```

Depois deste PR, o `npm run test:cobertura` já gera os quatro, e o CI publica o total no "Summary" de cada execução e sobe `backend/coverage/` e `frontend/coverage/` como artefatos (`cobertura-backend` e `cobertura-frontend`).

Os prints e o PDF saem do [`gerar-extrato.mjs`](../gerar-extrato.mjs), com o Chrome da máquina:

```bash
cd frontend
npm i --no-save playwright-core
node ../docs/testes/cobertura/gerar-extrato.mjs --pasta ../docs/testes/cobertura/m7 --milestone 7 --sha be59bd3ca70cad415ae58a960b70f3b719a3c4e6 --ci https://github.com/Christiansalles/ot-srs-platform/actions/runs/43752726559 --data 15/11/2026 --testes-back 303 --testes-front 385 --e2e "128 casos: 114 passaram e 14 foram pulados por tamanho de tela"
```

## Como mostrar no vídeo

1. No terminal, em `backend/`, rode `npm run test:cobertura`. O Jest mostra os testes passando, a tabela por arquivo e o "Coverage summary" no fim.
2. Abra `backend/coverage/lcov-report/index.html` no navegador. Clique numa pasta (por exemplo `src/routes`) e num arquivo: as linhas em vermelho são as que nenhum teste executou.
3. Repita em `frontend/` com `npm run test:cobertura` e abra `frontend/coverage/index.html`.
4. Se quiser mostrar o CI: na aba Actions do GitHub, abra uma execução do workflow "CI" feita depois deste PR. O "Summary" tem a tabela de cobertura das duas partes, e os relatórios HTML estão em "Artifacts".

## Para o relatório (#251)

| Parte | Testes | Linhas | Instruções | Ramos | Funções |
|---|---|---|---|---|---|
| Backend (Jest, unidade e API) | 303 | 95,26% | 91,20% | 85,90% | 93,79% |
| Frontend (Vitest, unidade) | 385 | 95,02% | 91,92% | 87,06% | 95,46% |
| Ponta a ponta (Playwright) | 128 (114 passaram, 14 pulados por tamanho de tela) | não medida | | | |

Commit `be59bd3`. Extrato completo em `docs/testes/cobertura/m7/`.
