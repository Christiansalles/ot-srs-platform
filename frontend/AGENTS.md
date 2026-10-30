# AGENTS.md: frontend

Vale junto com o [AGENTS.md da raiz](../AGENTS.md). Antes de fazer uma tela, abra o HTML dela em [docs/referencias/stitch/](../docs/referencias/stitch/README.md) e o trecho correspondente de [docs/contrato-api.md](../docs/contrato-api.md).

## Estrutura

```
src/
├── App.jsx           rotas: páginas públicas dentro do AppLayout; /admin protegido por RotaProtegida + AdminLayout
├── pages/            uma página por rota (Home, Indicadores, Dashboard/, Relatórios, AdminLogin, Admin)
├── components/       uma pasta por componente: Nome/Nome.jsx + Nome.css (AdminLayout/AdminPagina.css é a base do painel)
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
- **Estilo:** CSS por componente, com as variáveis e os tokens de `theme/`. Fora de `theme/` não há cor solta (hexadecimal, `rgb()`, `hsl()` ou nome como `white`) nem `font-family`; para clarear um token, use `color-mix(in srgb, var(--color-...) 8%, var(--color-surface))`. Gradiente só em destaque (hero, cabeçalho, botão primário), com fundo claro no resto.
- **Texto:** sem travessão (—) em texto de interface, `alt`, mensagem ou teste. Use vírgula, dois-pontos ou parênteses ("Número de leitos (Hospedagem)").
- **Gráficos:** Recharts, com a paleta `colors.chart`. Confira os rótulos dos eixos em 320 e 375 px; o Recharts esconde rótulo que não cabe (ver `docs/evidencias/pr-130`).
- **Acessibilidade:** use elementos semânticos (`<table>`, `<article>`, cabeçalhos em ordem), `label` nos campos, nome acessível em link e botão só com ícone, e navegação por teclado nos filtros.
- **Responsivo:** nada pode rolar na horizontal em 320 a 390 px, exceto tabelas largas dentro de um contêiner com rolagem própria.
- **Painel:** botões de publicar e despublicar só aparecem para o perfil `administrador`. O visual segue a seção [Painel administrativo](#painel-administrativo).
- **Variáveis `VITE_*`** são públicas no navegador: nunca coloque segredo nelas. Mudar uma delas exige reiniciar o Vite ou refazer o build.

## Painel administrativo

As telas de `/admin` (Telas 6, 7 e 8) têm de parecer uma só aplicação ao trocar de tela pelo menu. Por isso o cabeçalho, os cartões, os campos, os botões, os estados e a tabela vêm de uma base comum, e o CSS de cada página fica só com o que é dela.

| Peça | Use | Onde está |
|---|---|---|
| Página | `<section className="admin-pagina minha-pagina">` (largura de 1440 px) | `components/AdminLayout/AdminPagina.css`, carregado pelo `AdminLayout` |
| Cabeçalho | `<AdminCabecalho id sobretitulo titulo descricao>`, com a ação opcional como filho (ex.: "Voltar ao painel") | `components/AdminCabecalho/` |
| Cartão | `admin-cartao`, com `admin-cartao__titulo` (h2) e `admin-cartao__descricao` | `AdminPagina.css` |
| Campo de formulário | `<label className="admin-campo">Rótulo <span>(opcional)</span><input /></label>`; o `<span>` é para unidade ou "(opcional)", e o `<small>` é o contador | `AdminPagina.css` |
| Botões | `admin-acoes` com `admin-botao admin-botao--secundario` (Cancelar, Limpar) e `admin-botao admin-botao--primario` (gradiente); `admin-botao-contorno` para "Tentar novamente", "Limpar filtros" e "Voltar ao painel" | `AdminPagina.css` |
| Mensagens | `admin-mensagem` com `--erro`, `--sucesso` (verde) ou `--aviso`; `admin-nota` para regra fixa do formulário | `AdminPagina.css` |
| Carregando, vazio e erro | `admin-estado` (e `admin-estado--erro`), dentro do cartão ou junto com `admin-cartao` quando ocupa a página | `AdminPagina.css` |
| Tabela | `admin-tabela-rolagem` com `<table className="admin-tabela minha-tabela">`; a página define só o `min-width` e as colunas próprias | `AdminPagina.css` |

Regras:

- **A referência é a Tela 6** (`pages/AdminPage.jsx`). Tela nova copia a estrutura dela, não o CSS.
- **Não redefina a base na página.** Se algo da base não serve, ajuste `AdminPagina.css` (vale para todas as telas) ou escope pela classe da página (`.admin-relatorios .admin-cabecalho { ... }`). Medidas que valem para o painel: título com `clamp(1.75rem, 3vw, 2rem)` e peso 800, cantos de 14 px no cartão, 9 px no campo e 8 px no botão.
- **O mockup manda no layout, não no estilo.** Do HTML do Stitch vêm a ordem dos blocos e os textos; cores, tamanhos e cantos vêm da base. A exceção já registrada são os filtros da Tela 6, com fundo cinza como no mockup.
- **Compare com as telas que já existem.** Nos prints do PR, abra a Tela 6 na mesma largura e confira se o título, os cartões e os botões batem.

O teste `src/__tests__/padraoVisual.test.js` roda no CI e reprova:

- cor solta ou `font-family` fora de `theme/`;
- travessão em qualquer arquivo de `src/`;
- página `pages/Admin*Page.jsx` (menos o login) sem `AdminCabecalho` ou sem `admin-pagina`;
- CSS fora da base que redefine uma classe da base (`.admin-cartao`, `.admin-botao`...) ou estiliza `h1` numa página do painel.

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
