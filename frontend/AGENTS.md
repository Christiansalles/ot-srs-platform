# AGENTS.md: frontend

Vale junto com o [AGENTS.md da raiz](../AGENTS.md). Antes de fazer uma tela, abra o HTML dela em [docs/referencias/stitch/](../docs/referencias/stitch/README.md) e o trecho correspondente de [docs/contrato-api.md](../docs/contrato-api.md).

## Estrutura

```
src/
├── App.jsx           rotas: páginas públicas dentro do AppLayout; /admin protegido por RotaProtegida + AdminLayout
├── pages/            uma página por rota (Home, Indicadores, Dashboard/, Relatórios, AdminLogin, Admin)
├── components/       uma pasta por componente: Nome/Nome.jsx + Nome.css
├── services/         api.js (público), admin.js (painel), auth.js (token no sessionStorage)
├── mocks/            dados.js, relatorios.js, admin.js: mesmo formato e mesmos números da carga do backend
├── utils/            funções puras de transformação (montarCards, montarDistribuicao, formatarValor...)
├── config.js         API_URL, a partir de VITE_API_URL
├── config/           configuração de domínio (quais indicadores aparecem onde)
├── theme/            colors.js e theme.css: as únicas fontes de cor e tipografia
└── __tests__/        um arquivo de teste por componente, página, service ou util
```

## Padrões

- **Dados só pelos services.** Página e componente nunca chamam `fetch` direto. Use `services/api.js` ou `services/admin.js`, que já tratam o token, o `401` (logout) e as mensagens de erro.
- **Mock explícito.** `VITE_USE_MOCK=true` faz os services devolverem os mocks. Se a API falhar, a tela mostra o erro; o mock não entra automaticamente. Ao mudar o contrato, atualize o mock no mesmo PR, com os mesmos ids e valores do seed.
- **Estados de tela:** toda página que busca dados trata carregando, erro e vazio, além do caso com dados.
- **Filtros na URL:** `ano`, `semestre` e `setor` ficam na query string, via `FiltrosPainel`. Para ler, use `lerFiltros(params)` de `components/FiltrosPainel/filtros.js`.
- **Estilo:** CSS por componente, com as variáveis e os tokens de `theme/`. Não há cor em hexadecimal fora de `theme/`, e deve continuar assim. Gradiente só em destaque (hero, cabeçalho, botão primário), com fundo claro no resto.
- **Gráficos:** Recharts, com a paleta `colors.chart`. Confira os rótulos dos eixos em 320 e 375 px; o Recharts esconde rótulo que não cabe (ver `docs/evidencias/pr-130`).
- **Acessibilidade:** use elementos semânticos (`<table>`, `<article>`, cabeçalhos em ordem), `label` nos campos, nome acessível em link e botão só com ícone, e navegação por teclado nos filtros.
- **Responsivo:** nada pode rolar na horizontal em 320 a 390 px, exceto tabelas largas dentro de um contêiner com rolagem própria.
- **Painel:** botões de publicar e despublicar só aparecem para o perfil `administrador`.
- **Variáveis `VITE_*`** são públicas no navegador: nunca coloque segredo nelas. Mudar uma delas exige reiniciar o Vite ou refazer o build.

## Testes

- Vitest + Testing Library + jsdom (`globals: true`, setup em `src/setupTests.js`).
- Em teste de página, simule o service com `vi.mock('../services/api', ...)` e devolva `structuredClone(mock...)`. Não use `fetch` de verdade.
- Prefira consultas por papel e nome acessível (`getByRole('heading', { name })`) a classes CSS.
- Cubra os estados de carregando, erro e vazio, e os filtros vindos da URL quando a tela tiver.

```bash
npm test                               # tudo
npx vitest run src/__tests__/RelatoriosPage.test.jsx   # um arquivo
npm run lint                           # oxlint
npm run build                          # o aviso de bundle acima de 500 kB já é conhecido
```

## Conferir no navegador

```bash
# frontend/.env com VITE_USE_MOCK=true
npm run dev   # http://localhost:5173
```

Confira em 375 e 1280 px, sem erro no console. Para tela que depende da API real, use `docker compose up --build` na raiz e abra <http://localhost:8080>. Prints de PR vão em `docs/evidencias/pr-N/` (ver [fluxo de trabalho](../docs/fluxo-de-trabalho.md)).
