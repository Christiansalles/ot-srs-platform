# ot-srs-platform

Plataforma do Observatório do Turismo para consultar e visualizar os indicadores dos relatórios de turismo. O Milestone 4 começa pelo setor de Hospedagem: banco, API e tela.

Projeto da disciplina C317 (Inatel), Grupo 8.

## Estrutura

```
ot-srs-platform/
├── backend/             API em Node.js + Express
│   ├── prisma/          schema, migrações e carga de dados
│   ├── src/             app.js, server.js, routes/, services/
│   └── tests/           testes Jest + Supertest
├── frontend/            React + Vite
│   └── src/             components/, pages/, services/, mocks/, theme/, __tests__/
├── docs/                contrato da API, fluxo de trabalho e relatórios dos milestones
└── .github/workflows/   CI
```

## Como rodar

Para subir o sistema completo, é necessário ter o Docker Desktop ativo e configurado
para containers Linux, com Docker Compose disponível. Node.js 20 ou mais recente é
necessário apenas para rodar a API, o frontend ou os testes diretamente na máquina.

A versão entregue de cada Milestone fica na branch `main`. A branch padrão do
repositório é a `develop`, então troque de branch depois de clonar:

```bash
git clone https://github.com/Christiansalles/ot-srs-platform.git
cd ot-srs-platform
git switch main
```

### Subir o sistema completo

Na raiz do repositório, execute:

```bash
docker compose up --build
```

Na primeira execução, o Docker baixa as imagens necessárias e constrói as imagens
do backend e do frontend. O backend aguarda o PostgreSQL ficar saudável, aplica as
migrations e executa o seed antes de iniciar a API.

| Serviço | Endereço |
| --- | --- |
| Frontend | <http://localhost:8080> |
| API | <http://localhost:3000> |
| Health check da API | <http://localhost:3000/api/health> |
| Adminer | <http://localhost:8081> |

No Adminer, informe `db` como servidor, `ot` como usuário, `ot` como senha e
`ot_srs` como banco. Para parar os serviços, pressione Ctrl+C ou execute
`docker compose down` em outro terminal na raiz do projeto.

### Rodar os testes

Os testes do backend usam PostgreSQL. Na raiz do repositório, inicie o banco de
teste e, se ainda não existir, crie o arquivo local de configuração:

```bash
docker compose up -d --wait db
if [ ! -f backend/.env ]; then cp backend/.env.example backend/.env; fi
```

No PowerShell, troque a segunda linha por
`if (-not (Test-Path backend/.env)) { Copy-Item backend/.env.example backend/.env }`.

Se a máquina já tiver um PostgreSQL instalado na porta 5432, os testes conectam nele
em vez do container e falham com `P1000: Authentication failed`. Nesse caso, suba o
banco em outra porta com `POSTGRES_PORT=5433 docker compose up -d --wait db` (no
PowerShell: `$env:POSTGRES_PORT=5433; docker compose up -d --wait db`) e use a mesma
porta na `DATABASE_URL` do `backend/.env`.

Depois, instale as dependências e prepare o banco antes de rodar os testes:

```bash
cd backend
npm ci
npm run db:setup
npm test
```

Os testes do frontend não precisam do PostgreSQL:

```bash
cd ../frontend
npm ci
npm test
```

Ao terminar, pare o banco de teste a partir da raiz do repositório:

```bash
cd ..
docker compose down
```

O CI também executa lint e build do frontend (`npm run lint` e `npm run build`).

### Backend

Copie `backend/.env.example` para `backend/.env` e ajuste os valores para seu ambiente.
No PowerShell, a partir da raiz do projeto:

```powershell
Copy-Item backend/.env.example backend/.env
```

```bash
cd backend
npm ci
npm run dev     # sobe a API em http://localhost:3000, sem preparar o banco
```

Para iniciar o backend como em produção, use `npm start`. Esse comando aplica as
migrations pendentes e executa o seed antes de subir a API. Ele precisa de um
PostgreSQL acessível pela `DATABASE_URL`. Para preparar o banco manualmente no
desenvolvimento, execute `npm run db:setup` antes de `npm run dev`.

Teste rápido: abra `http://localhost:3000/api/health`. A resposta deve ser `{"status":"ok"}`.

### Frontend

Copie `frontend/.env.example` para `frontend/.env`. No PowerShell, a partir da raiz:

```powershell
Copy-Item frontend/.env.example frontend/.env
```

```bash
cd frontend
npm ci
npm test        # roda os testes
npm run dev     # sobe o front em http://localhost:5173
```

### Dockerfiles (#31)

Com o Docker ativo e configurado para containers Linux, execute na raiz do projeto:

```bash
docker build -t ot-srs-backend ./backend
docker build --build-arg VITE_API_URL=http://localhost:3000 -t ot-srs-frontend ./frontend
```

Inicie cada container em um terminal separado:

```bash
docker run --rm --name ot-srs-backend -p 3000:3000 ot-srs-backend
docker run --rm --name ot-srs-frontend -p 8080:80 ot-srs-frontend
```

A API responde em `http://localhost:3000/api/health`; o frontend fica em
`http://localhost:8080`. Use Ctrl+C em cada terminal para encerrar os containers.

O backend gera o cliente Prisma durante o build, mantém dependências de produção
na imagem final e executa como usuário `node`. Forneça `DATABASE_URL` para um
servidor PostgreSQL acessível ao container, usando `--env-file backend/.env` no
comando `docker run`. Ao iniciar, o backend aplica as migrations e executa o seed.
No Docker Desktop,
um banco da máquina hospedeira pode ser acessado por `host.docker.internal`.
Para mudar a porta interna da API, combine `-e PORT=4000` com `-p 4000:4000`.

O frontend é compilado com Node e servido pelo Nginx. A configuração permite
abrir rotas do frontend diretamente, e arquivos inexistentes em `/assets/`
retornam 404. O argumento `VITE_API_URL` está preparado para a configuração
da #30: o endereço deve ser acessível pelo navegador e mudanças exigem novo build.

Os arquivos `.dockerignore` excluem `.env`, dependências locais e outros arquivos
desnecessários. Não são copiadas credenciais locais para as imagens.

O workflow `.github/workflows/docker.yml` constrói as imagens e verifica health
da API, página inicial, fallback de rotas e 404 de assets. A inicialização
conjunta dos serviços é feita pelo Docker Compose, documentado acima.

### Variáveis de ambiente

| Variável | Arquivo | Finalidade | Exemplo local |
| --- | --- | --- | --- |
| `DATABASE_URL` | `backend/.env` | Conexão PostgreSQL usada pela integração do banco | `postgresql://ot:ot@localhost:5432/ot_srs` |
| `PORT` | `backend/.env` | Porta HTTP da API; padrão `3000` | `3000` |
| `CORS_ORIGIN` | `backend/.env` ou ambiente/`.env` do Compose | Origem permitida para chamadas do navegador; vazio libera todas | `http://localhost:5173` |
| `VITE_API_URL` | `frontend/.env` | Endereço público da API, sem `/api` no final | `http://localhost:3000` |

As credenciais do exemplo são ilustrativas: o banco, usuário e senha precisam existir
no PostgreSQL. `npm start` aplica migrations e seed automaticamente; `npm run dev`
apenas sobe a API, então requer que o banco já esteja preparado.
O backend carrega seu `.env` ao iniciar, antes de importar a aplicação. Variáveis já
definidas no terminal, CI ou Docker têm prioridade sobre esse arquivo.

O Vite carrega o `.env` do frontend automaticamente. O módulo `frontend/src/config.js`
exporta `API_URL` para as chamadas futuras, por exemplo, `fetch(API_URL + '/api/health')`.
Sem configuração, a URL é `http://localhost:3000`. Se mudar `PORT`, ajuste também
`VITE_API_URL`. Reinicie os servidores após alterar os arquivos `.env`; para uma
versão de produção do frontend, gere um novo build, pois o Vite incorpora a URL no build.
Variáveis `VITE_*` são públicas no navegador: nunca coloque senhas nelas.

Os arquivos `.env` são locais e ignorados pelo Git. Versione apenas os `.env.example`,
sem credenciais reais. No Docker, a URL do banco deve usar o nome do serviço do banco;
a URL do frontend deve continuar apontando para um endereço acessível pelo navegador.

### Configuração do Docker Compose

Por padrão, o PostgreSQL usa banco `ot_srs`, usuário `ot` e senha `ot`. Para substituir
esses padrões, defina `POSTGRES_DB`, `POSTGRES_USER` e `POSTGRES_PASSWORD` no ambiente
ou em um `.env` na raiz. As portas também podem ser alteradas com `POSTGRES_PORT`,
`BACKEND_PORT`, `FRONTEND_PORT` e `ADMINER_PORT`. `VITE_API_URL` define o endereço da
API que o navegador usará; se mudar esse endereço, reconstrua o frontend. `CORS_ORIGIN`
define a origem permitida pela API; se ficar vazia, a API libera qualquer origem.

Os dados do PostgreSQL ficam no volume persistente `postgres_data`. Para parar os
serviços, use `docker compose down`. Para apagar também os dados persistidos, use
`docker compose down -v`. Na inicialização, o backend aplica migrations e executa o
seed antes de começar a atender requisições. O workflow
`.github/workflows/compose.yml` também verifica no CI se o banco, a API, o frontend
e o Adminer ficam acessíveis.

## Como contribuir

Leia [docs/fluxo-de-trabalho.md](docs/fluxo-de-trabalho.md) antes de abrir a primeira branch. O contrato da API está em [docs/contrato-api.md](docs/contrato-api.md).

## Dados do frontend

A URL VITE_API_URL contém somente a base (por exemplo, http://localhost:3000); os serviços adicionam /api às rotas. VITE_USE_MOCK=false usa a API e exibe erros de consulta na tela. Para desenvolver ou conferir os dados ilustrativos sem backend, configure VITE_USE_MOCK=true no frontend/.env e reinicie o Vite. O mock não é ativado automaticamente em caso de erro.

As referências visuais e capturas de tela do frontend estão em [docs/pr-48](docs/pr-48/README.md).

### Filtros dos serviços (#109)

`getIndicadores({ setor, ano, semestre })` e `getDestaques({ setor, ano, semestre })`
aceitam filtros opcionais. Apenas os valores preenchidos entram na URL; chamadas
sem argumentos continuam funcionando. Exemplo: `getIndicadores({ setor: 1, ano: 2024 })`.

No modo mock, os dados incluem 6 setores, 12 indicadores e 23 medições, com o
histórico de empresas e empregos registrado no PR #117. Os IDs são locais ao mock.
O filtro de ano inclui os dois semestres disponíveis; o destaque usa o mais recente
do ano e calcula a variação contra a medição anterior, mesmo fora do filtro.
Semestre exige ano, e filtros válidos sem dados retornam uma lista vazia.
Os valores são ilustrativos e aguardam os dados oficiais da SMCELT.

Para conferir, execute `npm test`, `npm run lint` e `npm run build` em `frontend/`.
A integração com a API real depende das rotas com filtros (#73) e da carga dos
demais setores (#85); o histórico adicional do mock acompanha o PR #117.
