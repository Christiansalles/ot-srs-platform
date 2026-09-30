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

Pré-requisito: Node.js 20 ou mais recente.

### Backend

Copie `backend/.env.example` para `backend/.env` e ajuste os valores para seu ambiente.
No PowerShell, a partir da raiz do projeto:

```powershell
Copy-Item backend/.env.example backend/.env
```

```bash
cd backend
npm install
npm test        # roda os testes
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
npm install
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

### Docker Compose (#32)

Com o Docker Desktop ativo e configurado para containers Linux, execute na raiz:

```bash
docker compose up --build
```

O Compose inicia PostgreSQL, API, frontend e Adminer. O backend aguarda o healthcheck
do banco antes de iniciar. Endereços locais: frontend `http://localhost:8080`, API
`http://localhost:3000/api/health`, Adminer `http://localhost:8081` e PostgreSQL
`localhost:5432`. No Adminer, use servidor `db` e as credenciais configuradas abaixo.

Por padrão, o PostgreSQL usa banco `ot_srs`, usuário `ot` e senha `ot`. Para substituir
esses padrões, defina `POSTGRES_DB`, `POSTGRES_USER` e `POSTGRES_PASSWORD` no ambiente
ou em um `.env` na raiz. As portas também podem ser alteradas com `POSTGRES_PORT`,
`BACKEND_PORT`, `FRONTEND_PORT` e `ADMINER_PORT`. `VITE_API_URL` define o endereço da
API que o navegador usará; se mudar esse endereço, reconstrua o frontend.

Os dados do PostgreSQL ficam no volume persistente `postgres_data`. Para parar os
serviços, use `docker compose down`. Para apagar também os dados persistidos, use
`docker compose down -v`.

Migrations e seed serão automatizados pela tarefa #33. Até essa integração, este
Compose inicia os serviços, mas não prepara tabelas nem insere os dados iniciais.

## Como contribuir

Leia [docs/fluxo-de-trabalho.md](docs/fluxo-de-trabalho.md) antes de abrir a primeira branch. O contrato da API está em [docs/contrato-api.md](docs/contrato-api.md).
