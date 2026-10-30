# AGENTS.md

Instruções para agentes de IA (Claude Code, Codex, Cursor, Copilot) e para quem programa com eles neste repositório. As regras específicas de cada parte estão em [backend/AGENTS.md](backend/AGENTS.md) e [frontend/AGENTS.md](frontend/AGENTS.md).

## O projeto

Plataforma web do Observatório do Turismo de Santa Rita do Sapucaí (OT-SRS), projeto da disciplina C317 do Inatel (Grupo 8) para a SMCELT. Tem um portal público, com indicadores, dashboard, filtros e relatórios em PDF, e um painel administrativo, onde a equipe da SMCELT cadastra e publica dados.

- `backend/`: API em Node 20+, Express 5, Prisma 6 e PostgreSQL. CommonJS. Testes com Jest e Supertest.
- `frontend/`: React 19, Vite, React Router 7 e Recharts. ES modules. Testes com Vitest e Testing Library; lint com oxlint.
- `docker-compose.yml`: banco, API, front (Nginx) e Adminer. É assim que o professor roda o projeto.

## Leia antes de mudar algo

| Para | Leia |
|---|---|
| Saber o que o sistema deve fazer | [docs/projeto/escopo.md](docs/projeto/escopo.md), o resumo da Proposta e a única fonte de requisitos |
| Não repetir uma discussão já encerrada | [docs/projeto/decisoes.md](docs/projeto/decisoes.md) |
| Rotas, campos e códigos de erro | [docs/contrato-api.md](docs/contrato-api.md) |
| Branches, commits, PRs e "pronto" | [docs/fluxo-de-trabalho.md](docs/fluxo-de-trabalho.md) |
| Layout de uma tela | [docs/referencias/stitch/](docs/referencias/stitch/README.md), com o HTML do mockup da tela |
| Cores, gradiente e logos | [docs/projeto/identidade-visual.md](docs/projeto/identidade-visual.md) e `frontend/src/theme/` |
| Padrão visual das telas do painel | [frontend/AGENTS.md, seção Painel administrativo](frontend/AGENTS.md#painel-administrativo) |
| Entregas e prazos do milestone | [docs/planejamento/](docs/planejamento/README.md) e o quadro do GitHub |

## Regras que não mudam

1. **Não inventar número.** Dados de indicador vêm de `backend/prisma/dados/*.json`, que são valores ilustrativos tirados dos mockups, cada um com `fonte`. Testes, mocks e textos usam esses mesmos valores. Não derive valores de percentuais do mockup.
2. **Rotas públicas só mostram `publicado`.** Rascunho nunca aparece numa rota pública, nem em contagem, destaque ou download. Existe teste de regressão para isso (`backend/tests/publicas.rascunho.test.js`).
3. **Contrato primeiro.** Mudar rota, campo, filtro ou código de erro exige atualizar `docs/contrato-api.md` no mesmo PR, além dos mocks do front.
4. **Dois status e dois perfis:** `rascunho`/`publicado` e `administrador`/`editor`. Não existe "homologado" nem aprovação do COMTUR. Só o administrador publica; o editor recebe `403`.
5. **Uma migração por PR**, criada com `npx prisma migrate dev --name <nome_claro>`. Nunca edite uma migração que já está na `develop`.
6. **Testes junto com o código.** Toda mudança de comportamento leva teste no mesmo PR.
7. **Sem segredos.** Não leia nem cole `.env`. Use só os valores de desenvolvimento de `.env.example` e do `docker-compose.yml`.
8. **Fora do escopo:** as telas de `docs/referencias/stitch/fora-do-escopo/`, a fase 2 da Proposta (salvo pedido explícito), agenda de eventos e "esqueci minha senha".

## Comandos

```bash
# Sistema completo (front :8080, API :3000, Adminer :8081)
docker compose up --build

# Backend: precisa do banco de pé e de backend/.env (copie de .env.example)
docker compose up -d --wait db
cd backend && npm ci && npm run db:setup && npm test

# Frontend: não precisa de banco
cd frontend && npm ci && npm run lint && npm test && npm run build
```

O CI (`.github/workflows/ci.yml`) roda exatamente isso, com Node 24, e também roda `db:setup` duas vezes, para garantir que migrações e seed podem ser repetidos. `compose.yml` sobe o Docker Compose completo e `docker.yml` constrói as imagens.

Antes de dizer que terminou, rode os testes e o lint da parte que mudou. Se não conseguir rodar algo, por exemplo o Docker, diga isso no PR.

## Convenções

- **Idioma:** código, comentários, mensagens de erro, commits, PRs e documentação em português, inclusive nomes de funções e variáveis (`buscarIndicadores`, `lerFiltros`, `montarCards`). Termos técnicos consagrados ficam em inglês (`router`, `middleware`, `token`).
- **Comentários:** poucos, explicando o porquê, não o quê.
- **Sem travessão (—)** em texto de interface, mensagem de erro ou teste: use vírgula, dois-pontos ou parênteses. No front, o `padraoVisual.test.js` reprova.
- **Branch:** `tipo/Entrega-issue-descricao`, por exemplo `feat/E15-188-filtros-relatorios`, sempre a partir da `develop`.
- **Commit:** `tipo(escopo): descrição no imperativo`, por exemplo `fix(frontend): corrige formato da variação no card`.
- **PR:** para a `develop`, preenchendo o [modelo](.github/pull_request_template.md). PR que muda tela leva prints em `docs/evidencias/pr-N/` (celular e desktop), com as URLs raw fixadas no SHA no corpo do PR.
- **`main`:** só recebe a `develop` validada, no fim de cada milestone. Não abra PR de tarefa para ela.
