<!--
Antes de criar, confira se a base é a `develop` (só o PR de versão validada aponta para a `main`).
Título no mesmo padrão dos commits: `feat(frontend): adiciona filtros na página de relatórios`.
Os comentários como este não aparecem no PR. Apague as seções marcadas como opcionais se não se aplicarem.
-->

## O que faz

<!-- O que muda para quem usa ou para quem programa, em poucas frases. Cite a tela do Stitch ou o trecho do contrato quando for o caso. -->

## Como testar

<!--
Comandos e passos que o revisor roda. Exemplos:

Em `backend/` (com o banco de pé: `docker compose up -d --wait db`):
    npm test

Em `frontend/`:
    npm test
    npm run lint
    npm run build

Para conferir a tela: `VITE_USE_MOCK=true` no `frontend/.env`, `npm run dev` e abrir a rota em 375 e 1280 px.
Se depende da API real: `docker compose up --build` e abrir http://localhost:8080.
-->

## Informações adicionais

<!-- Decisões tomadas, o que ficou de fora e em qual issue, dependências de outros PRs, avisos conhecidos (ex.: aviso de tamanho do bundle no build). -->

Closes #

## Evidências

<!--
OBRIGATÓRIO em PR que muda tela (frontend). Opcional no backend: resposta da API, saída dos testes ou do Adminer.

1. Salve os prints em `docs/evidencias/pr-<número do PR>/` nesta branch, com um README.md curto,
   dizendo como foram tirados (mock ou API real, larguras, navegador), e acrescente uma
   linha em `docs/evidencias/README.md`.
2. Tire pelo menos celular (375 ou 390 px) e desktop (1280 px). Inclua estados de
   carregando, vazio e erro quando a tela tiver, e antes/depois quando for correção.
3. No corpo do PR, use a URL raw fixada no SHA do commit dos prints, para a imagem
   não quebrar quando a branch for apagada:
   <img src="https://raw.githubusercontent.com/Christiansalles/ot-srs-platform/<sha>/docs/evidencias/pr-<N>/home-375.png" width="240">
-->

| Celular (375 px) | Desktop (1280 px) |
|---|---|
|  |  |

## Checklist

- [ ] A base do PR é a `develop` e a branch segue `tipo/Entrega-issue-descricao`.
- [ ] Os testes da mudança foram escritos junto e passam localmente; o CI está verde.
- [ ] Mudou rota, campo ou código de erro da API: `docs/contrato-api.md` está atualizado e o grupo foi avisado.
- [ ] Mudou o `schema.prisma`: há uma única migração, com nome claro.
- [ ] Rotas públicas continuam mostrando só conteúdo `publicado`.
- [ ] Nenhum número novo foi inventado: valores vêm da carga ou dos mockups do Stitch.
- [ ] Sem `.env`, senha, token ou credencial real no código, nos prints ou na descrição.
- [ ] O sistema sobe com `docker compose up --build`, sem passo manual escondido.
- [ ] Mudou tela: os prints estão em **Evidências**.
- [ ] Sei explicar o que o código faz, inclusive o que foi gerado com IA.
