# Validação do portal público (#264)

Entrega E19, branch `test/E19-264-e2e-portal`, criada a partir da develop em `67aa7e7`. Execução local em 13/11/2026, com PostgreSQL 18, backend, frontend Nginx e Adminer construídos e iniciados por Docker Compose no projeto isolado `ot-e2e-264`.

## Ambiente e resultados

- Frontend em `http://localhost:8264`, API em `http://localhost:3264` e banco próprio, sem mock de respostas.
- Microsoft Edge (Chromium), com as mesmas dimensões da configuração do CI: desktop 1280 x 800 e celular 390 x 844, com toque e escala 3 no celular.
- Foi usada uma sobreposição local temporária para o navegador Edge instalado. A configuração versionada continua usando o Chromium instalado pelo job `compose`.
- `portal.spec.js`: 20 execuções reconhecidas, 16 passaram e quatro ficaram com `test.fixme`, todas do CT-07 e vinculadas à #307.
- Lint do novo arquivo com oxlint e `git diff --check` passaram. O build de produção do frontend passou durante a construção do Compose.
- A primeira construção falhou por conexão com o Docker Hub; a repetição construiu e iniciou os quatro serviços.

Os valores esperados são lidos de `hospedagem.json`, `turismo.json` e `participacao.json`. Os únicos dados criados pelo teste são um indicador de nome único e sua medição de 2031/1 em rascunho, com valor de leitos da carga. O banco isolado pode ser descartado após a execução.

## Falha encontrada

[Bug #307](https://github.com/Christiansalles/ot-srs-platform/issues/307): ao abrir Indicadores ou Dashboard com `ano=2019`, o carregamento das opções remove o ano da URL e a tela volta a mostrar a carga completa. A API devolve `[]` para a consulta de indicadores nesse ano. O CT-07 continua esperando vazio e preservação da URL; o `fixme` deve ser retirado depois da correção.

## Verificação com regressão deliberada

1. Os casos CT-06 passaram com a implementação original: selecionar 2024 muda leitos de 350 para 312 e mantém o ano na URL.
2. Temporariamente, em `frontend/src/services/api.js`, `getDestaques` passou a enviar `{ ...filtros, ano: '' }`. Só o frontend do Compose foi reconstruído.
3. `portal.spec.js --grep CT-06` falhou nos dois projetos: o teste procurava `312 leitos`, mas os destaques continuavam em 2025/2, com 350 leitos.
4. O arquivo foi restaurado, conferindo SHA-256 idêntico ao original, e o frontend foi reconstruído novamente.
5. A rodada final voltou a passar nos 16 casos ativos. Nenhuma alteração da regressão deliberada faz parte da branch.

## Como repetir

Com o Compose isolado rodando nas portas padrão e o Chromium instalado conforme o README:

```bash
cd e2e
npx playwright test testes/portal.spec.js --workers 1
```

Para portas diferentes, use `E2E_BASE_URL` e `E2E_API_URL`. O job `compose` já descobre o arquivo em `e2e/testes/`, sem mudança no workflow. Não use dados reais nem o banco do dia a dia.
