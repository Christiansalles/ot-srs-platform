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
npm run dev     # sobe a API em http://localhost:3000
```

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

### Variáveis de ambiente

| Variável | Arquivo | Finalidade | Exemplo local |
| --- | --- | --- | --- |
| `DATABASE_URL` | `backend/.env` | Conexão PostgreSQL usada pela integração do banco | `postgresql://ot:ot@localhost:5432/ot_srs` |
| `PORT` | `backend/.env` | Porta HTTP da API; padrão `3000` | `3000` |
| `VITE_API_URL` | `frontend/.env` | Endereço público da API, sem `/api` no final | `http://localhost:3000` |

As credenciais do exemplo são ilustrativas: o banco, usuário e senha precisam existir
no PostgreSQL. Este arquivo não cria o banco nem executa migrations ou seed.
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

O `docker compose up --build` entra neste README quando o Docker estiver configurado.

## Como contribuir

Leia [docs/fluxo-de-trabalho.md](docs/fluxo-de-trabalho.md) antes de abrir a primeira branch. O contrato da API está em [docs/contrato-api.md](docs/contrato-api.md).
