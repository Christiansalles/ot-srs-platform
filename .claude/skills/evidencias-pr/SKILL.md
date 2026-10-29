---
name: evidencias-pr
description: Tira os prints de evidência de um PR de frontend do OT-SRS (celular e desktop), salva em docs/evidencias/pr-N com README, atualiza o índice e monta o bloco "Evidências" do corpo do PR com URLs raw fixadas no SHA. Use quando um PR muda tela, ou quando pedirem prints, evidências ou capturas de um PR.
---

# Evidências de PR

Todo PR que muda tela leva prints do celular e do desktop no corpo, como mandam o modelo de PR e `docs/fluxo-de-trabalho.md`. Os arquivos ficam no repositório porque o `gh` não sobe anexos.

## 1. Subir o front

Com mock, que é o caso mais comum:

```bash
cd frontend
# frontend/.env com VITE_USE_MOCK=true
npm run dev          # em segundo plano; espere a linha "Local: http://localhost:5173"
```

Para conferir com a API real: `docker compose up --build` na raiz e `--base http://localhost:8080` no passo 2.

Se o componente ainda não está montado em nenhuma página, monte-o localmente só para o print, **sem commitar**, e diga isso no README do passo 3.

## 2. Capturar

```bash
cd frontend
npm i --no-save playwright-core     # usa o Chrome da máquina; não baixa navegador
node ../.claude/skills/evidencias-pr/capturar.mjs --pr <N> --rotas /,/relatorios --larguras 375,1280
```

- Larguras mínimas: 375 (ou 390) e 1280. Acrescente 320 e 768 quando o PR for de responsividade.
- Para filtros, passe a rota com a query: `--rotas "/indicadores?setor=6&ano=2024"`.
- O script avisa se a página rola na horizontal ou se aparece erro no console, e termina com código 2. Resolva o problema ou explique no README antes de seguir.
- Estados de carregando, vazio e erro: capture com respostas controladas (por exemplo, interceptando o `fetch` ou ajustando o mock localmente sem commitar) e diga como foi feito.
- Correção visual: tire o "antes" na `develop` e o "depois" na branch, com os nomes `antes-375.png` e `depois-375.png`.

Abra alguns PNGs para conferir se mostram o que o PR muda. O headless pode diferir alguns pixels do navegador normal.

## 3. README da pasta

`docs/evidencias/pr-<N>/README.md`, curto, no formato das pastas existentes:

```markdown
# Evidências do PR #<N>: <assunto>

Capturas com `npm run dev` e `VITE_USE_MOCK=true`, no Chrome, em 375 e 1280 px.

| Arquivo | O que mostra |
|---|---|
| `relatorios-375.png` | ... |
```

Depois, acrescente uma linha na tabela do milestone em `docs/evidencias/README.md`, com pasta, PR, issue, entrega e o que mostra.

## 4. Commit e corpo do PR

```bash
git add docs/evidencias/pr-<N>
git commit -m "docs: adiciona evidências do PR #<N>"
git push
git rev-parse HEAD     # SHA para as URLs
```

No corpo do PR, na seção "## Evidências", use a URL raw **com o SHA**, não o nome da branch. Assim a imagem não quebra quando a branch for apagada:

```markdown
| Celular (375 px) | Desktop (1280 px) |
|---|---|
| <img src="https://raw.githubusercontent.com/Christiansalles/ot-srs-platform/<sha>/docs/evidencias/pr-<N>/home-375.png" width="240"> | <img src="https://raw.githubusercontent.com/Christiansalles/ot-srs-platform/<sha>/docs/evidencias/pr-<N>/home-1280.png" width="480"> |
```

Para atualizar o corpo: `gh pr edit <N> --body-file <arquivo>`. Se os prints foram para a branch de outra pessoa, avise que ela precisa dar `git pull`.
