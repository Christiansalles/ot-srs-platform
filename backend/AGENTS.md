# AGENTS.md: backend

Vale junto com o [AGENTS.md da raiz](../AGENTS.md). Antes de mexer em rota, leia o trecho correspondente de [docs/contrato-api.md](../docs/contrato-api.md).

## Estrutura

```
src/
├── app.js            monta o Express: CORS, JSON, rotas, 404 em JSON e o error handler por último
├── server.js         carrega o .env e sobe a API
├── db.js             PrismaClient único; só os services importam
├── routes/           validação da entrada e escolha do status HTTP; uma rota por recurso
├── services/         acesso ao banco (dados.js) e regras (indicadores, auth, senha, status, relatorios)
└── middlewares/      autenticar (JWT), exigirPerfil('administrador') e error-handler
prisma/
├── schema.prisma     modelos Setor, Indicador, Periodo, Medicao, Usuario, Relatorio
├── migrations/       uma pasta por migração; nunca editar as que já estão na develop
├── dados/            carga ilustrativa (JSON) e os PDFs de relatorios/
└── seed.js           idempotente: rodar duas vezes não duplica nada (o CI confere)
tests/                Jest + Supertest; fixtures/ e helpers/
```

## Padrões

- **Camadas:** a rota valida e responde, e o service fala com o Prisma. Rotas não importam `db.js`. Campos internos (`arquivo_url`, `id_usuario`, `senha_hash`) não saem da camada de service.
- **Erros:** respondem sempre `{ "erro": "mensagem em português" }`. Valide a entrada na rota e devolva `400`, `404` ou `409` explicitamente. Exceção inesperada vai para o `error-handler`, que responde `500` sem detalhes. Erro de banco previsível (por exemplo, o `@@unique` da medição) vira `409`, nunca `500`.
- **Express 5:** handler `async` pode lançar; o Express encaminha a exceção ao `error-handler` sem precisar de `try/catch` ou `next(err)`.
- **Ids e status:** use `lerId` e `lerStatus` de `services/status.js`. Id fora do formato é tratado como inexistente (`404`), sem consultar o banco.
- **Filtros públicos:** `ano` tem 4 dígitos; `semestre` é 1 ou 2 e só vale com `ano`. Reaproveite a validação que já existe em vez de copiar.
- **Autenticação:** rotas `/api/admin/*` usam `autenticar`; publicar e despublicar usam também `exigirPerfil('administrador')`. Sem token ou com token inválido, `401`; perfil errado, `403`.
- **`valor`:** no banco é `NUMERIC(12,2)` e o Prisma devolve `Decimal`. Converta para `number` antes de responder.
- **Ordem:** setores e indicadores por `nome`; períodos e medições por `ano` e depois `semestre`; relatórios do mais recente para o mais antigo.
- **Variáveis novas:** entram no `backend/.env.example`, no `docker-compose.yml` e no `.github/workflows/ci.yml`, sempre com valores de desenvolvimento. Senão o CI ou o Compose quebram.

## Testes

- Teste de rota usa Supertest contra `app` com `jest.mock('../src/services/dados')` e as fixtures de `tests/fixtures/dados.js`. Não precisa de banco.
- Teste de seed, banco ou regressão de rascunho roda contra o PostgreSQL de verdade e precisa de `npm run db:setup` antes.
- Os testes rodam em série (`--runInBand`, `maxWorkers: 1`), porque compartilham o banco. Limpe o que criar e chame `prisma.$disconnect()` no `afterAll`.
- Para cada rota nova, cubra pelo menos: caminho feliz, `400` de entrada inválida, `404`, `401`/`403` quando for admin, e que rascunho não vaza em rota pública.

```bash
docker compose up -d --wait db   # na raiz
npm run db:setup                 # migrações e seed
npm test                         # tudo
npx jest tests/relatorios.rotas.test.js   # um arquivo
```

Se os testes falharem com `P1000: Authentication failed`, há outro PostgreSQL na porta 5432. Veja o README da raiz.

## Migrações

1. Altere `prisma/schema.prisma`.
2. `npx prisma migrate dev --name nome_claro_em_snake_case`.
3. Ajuste o `seed.js` se precisar e confira que `npm run db:setup` roda duas vezes seguidas sem erro.
4. Atualize o DER no contrato ou nas docs se o modelo mudar de forma visível para o front.
