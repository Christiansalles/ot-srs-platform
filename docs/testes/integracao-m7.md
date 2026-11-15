# Integração do Milestone 7 (#245)

Conferência de 15/11/2026 na `develop` em `230fa3d` (merge do #313), depois de fechadas as dependências #244, #255, #261, #268 e #269.

## PRs do M7

Nenhum PR aberto no repositório em 15/11. As cinco issues de que a #245 depende estão fechadas, com os PRs mergeados na `develop`.

## E2E no CI

Execução do workflow Docker Compose no `230fa3d`: [run 43750417405](https://github.com/Christiansalles/ot-srs-platform/actions/runs/43750417405), com sucesso. O job `compose` rodou `npx playwright test` nos projetos `desktop` e `celular`:

- **114 passaram, 0 falharam, 14 pulados.**
- **Nenhum `test.fixme`** em `e2e/testes/`. O último, do CT-07, saiu com a correção da #307 no #310.

Os 14 pulados são casos de um só tamanho de tela, com o motivo no `test.skip`. Nenhum esconde bug:

| Projeto | Casos pulados | Por quê |
|---|---|---|
| desktop | CT-36 (menu do painel no celular), tabela de Indicadores no celular, painel em 375 px (CT-24) | Conferem a interface de celular, que só existe abaixo de 900 px |
| celular | CT-17, CT-18 (administrador e editor), CT-20, CT-21, CT-22 | Rodam no desktop; no celular, o CT-24 cobre login, cadastro e upload (#269) |
| celular | CT-26, CT-27, CT-28, CT-29, CT-31 | Publicação e perfis rodam no desktop; o painel no celular é o CT-24 (#269) |

Os jobs CI (backend e frontend) e Docker do mesmo commit também passaram.

## Roteiros manuais com a API real

Sistema de pé com `docker compose -p ot-integracao up --build -d`, no banco próprio desse projeto, a partir do `230fa3d`. Navegador Chromium em 1024 x 768, usando o administrador e o editor de desenvolvimento do `docker-compose.yml`. Os dados criados são de 2031, como pede o [plano de testes](plano-de-testes.md#ambiente-e-dados).

### Roteiro do M6

| Passo | Resultado |
|---|---|
| Cadastrar medição de Número de leitos em 2031/1, valor 350 | "Medição cadastrada como rascunho." |
| Cadastrar de novo o mesmo indicador em 2031/1 | "Já existe uma medição deste indicador em 2031/1", formulário preenchido |
| Publicar a medição no painel | Confirmação no diálogo e "publicada no portal" |
| Abrir `/dashboard?ano=2031` | Card e gráfico mostram 2031/1 com 350 leitos |
| Despublicar e abrir o dashboard de novo | "voltou para rascunho"; o dashboard de 2031 mostra "Sem indicadores disponíveis no momento." |
| Subir um PDF em Relatórios | "Relatório enviado como rascunho. Ele ainda não aparece no portal público." |
| Publicar o relatório e abrir `/relatorios` | O relatório aparece com o botão "Baixar PDF" |
| Baixar o PDF | `200`, `application/pdf`, conteúdo começando com `%PDF` |
| Despublicar o relatório | Some de `GET /api/relatorios`, e o download dá `404` |

### Roteiro novo: editor

| Passo | Resultado |
|---|---|
| Como administrador, criar um editor na tela Usuários | "Usuário ... criado com sucesso.", na lista como Editor e Ativo |
| Sair e entrar com o editor novo | Entra no painel; não há menu Usuários nem botões de publicar |
| Voltar como administrador e desativar o editor | Diálogo de confirmação e "desativado com sucesso"; o botão vira "Reativar" |
| Tentar entrar com o editor desativado | "E-mail ou senha inválidos", e continua na tela de login |

Nenhum dos roteiros encontrou bug novo.

## O que fica fora desta issue

- O exploratório num celular de verdade (CT-39) continua pendente para o critério de pronto 5 do plano de testes.
- A medição da cobertura no fim do M7 é a #277.
