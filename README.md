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

```bash
cd backend
npm install
npm test        # roda os testes
npm run dev     # sobe a API em http://localhost:3000
```

Teste rápido: abra `http://localhost:3000/api/health`. A resposta deve ser `{"status":"ok"}`.

### Frontend

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
na imagem final e executa como usuário `node`. Para consultar dados, forneça
`DATABASE_URL` para um banco PostgreSQL preparado e acessível ao container,
usando `--env-file backend/.env` no comando `docker run`. No Docker Desktop,
um banco da máquina hospedeira pode ser acessado por `host.docker.internal`.
Para mudar a porta interna da API, combine `-e PORT=4000` com `-p 4000:4000`.

O frontend é compilado com Node e servido pelo Nginx. A configuração permite
abrir rotas do frontend diretamente, e arquivos inexistentes em `/assets/`
retornam 404. O argumento `VITE_API_URL` está preparado para a configuração
da #30: o endereço deve ser acessível pelo navegador e mudanças exigem novo build.

Os arquivos `.dockerignore` excluem `.env`, dependências locais e outros arquivos
desnecessários. Não são copiadas credenciais locais para as imagens.

O workflow `.github/workflows/docker.yml` constrói as imagens e verifica health
da API, página inicial, fallback de rotas e 404 de assets. A execução conjunta
com `docker compose up --build` entra na #32; migrations e seed, na #33.

## Como contribuir

Leia [docs/fluxo-de-trabalho.md](docs/fluxo-de-trabalho.md) antes de abrir a primeira branch. O contrato da API está em [docs/contrato-api.md](docs/contrato-api.md).
