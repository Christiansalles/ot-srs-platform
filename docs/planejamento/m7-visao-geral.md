> Cópia do `Milestone7_Tarefas/00_Visao_Geral_M7.md`, mantido fora do repositório pelo grupo. Os arquivos individuais citados aqui não foram copiados; as tarefas de cada pessoa estão nas issues do milestone "Milestone 7" no quadro.

# Milestone 7: visão geral do grupo

**Entrega:** sexta, 13/11, assíncrona (o professor avalia sem a gente na frente).
**Tema do professor:** Testes (*Tests and Integration*).
**Meta:** 95% do projeto, ou seja, as entregas E1 a E19 prontas (19 de 20). No M7 fecham a **E18** (responsividade e acessibilidade em todas as telas) e a **E19** (testes de ponta a ponta dos fluxos principais). A E20 (versão final, documentação e manual do painel) fica para o M8.
**Fatia:** testar o sistema inteiro como a SMCELT e o público vão usar, com cada pessoa testando a parte de outra, e corrigir o que aparecer. Junto entram três dívidas que os relatórios anteriores prometeram: limite de tentativas no login, cadastro de usuários pelo painel e "Atualizado em" nas medições.

Cada um tem um arquivo próprio nesta pasta com as suas tarefas. Este aqui vale para todos.

---

## O que entra no M7

| Item | O que é | Quem faz | Revisor do PR |
|---|---|---|---|
| Plano de testes | `docs/testes/plano-de-testes.md`: níveis de teste, casos por fluxo, quem testa o quê, como reportar bug, cobertura | Christian | Todos (cada um confere a sua área) |
| E19 · base | Playwright na pasta `e2e/`, ajudantes de login e dados, e o job no CI rodando contra o `docker compose` | Christian | Samuel |
| E19 · portal público | Home, Indicadores, Dashboard e filtros, no desktop e no celular (partes do Samuel, da Karolina e da Giovana) | Maria Clara | Samuel e Karolina |
| E19 · painel | Login, cadastro de medição, duplicada, edição e upload de PDF (partes da Maria Clara e da Giovana) | Samuel | Maria Clara |
| E19 · relatórios públicos | Lista, filtros, download e rascunho que nunca aparece (partes do Samuel, da Giovana e do Christian) | Karolina | Samuel |
| E19 · publicação e perfis | Publicar e ver no portal, despublicar e sumir, editor sem botões, cadastro de usuários (partes da Karolina, do Christian e da Maria Clara) | Giovana | Karolina e Christian |
| E18 · celular | Menu do celular, tabela de Indicadores, painel no celular e página 404 | Samuel | Karolina |
| E18 · acessibilidade | Auditoria (teclado, foco, rótulos, contraste, gráficos), verificação automática com axe no E2E e correções | Karolina | Samuel |
| Dívida · login | Limite de tentativas no login (#108) | Maria Clara | Christian |
| Dívida · usuários | API de usuários (Christian) e tela Usuários no painel (Maria Clara), só para o administrador | Christian e Maria Clara | Giovana (back) / Samuel (front) |
| Dívida · atualizado em | Migração `criado_em`/`atualizado_em` na medição, API e o texto "Atualizado em" no painel e no dashboard | Giovana | Christian (back) / Karolina (front) |
| Bugs | Cada falha encontrada vira issue com o rótulo `bug`; o Christian faz a triagem e distribui | Todos | Quem fez a parte original |

**Regra do rodízio:** ninguém escreve o teste de ponta a ponta da própria parte. Quem revisa o PR de um teste é quem fez a parte testada, porque sabe se o teste descreve o comportamento certo.

## Decisões deste milestone

### Cadastro de usuários pelo painel

A Proposta não pede perfis nem cadastro de usuários: ela fala só numa "área simples para que a equipe da SMCELT atualize e publique novos dados". Os perfis (administrador e editor) vieram da E13, que o grupo escreveu assim desde o M4, e já estão prontos. O relatório do M6 prometeu o cadastro de usuários para o M7, e sem ele uma pessoa nova da SMCELT só ganha acesso mexendo no banco. Então:

- **Tela Usuários** no painel, só para o administrador: lista, cria (nome, e-mail, senha inicial e perfil), troca o perfil, redefine a senha e desativa.
- **Desativar, nunca apagar.** As medições e os relatórios guardam quem lançou (`id_usuario`); apagar o usuário apagaria esse histórico. A Proposta pede para "preservar o histórico de dados entre mudanças de gestão".
- Quem é desativado perde o acesso na hora: o `autenticar` já lê o usuário do banco a cada requisição e recusa quem não está ativo.
- O administrador não pode desativar a si mesmo nem tirar o próprio perfil de administrador, para o sistema nunca ficar sem administrador ativo.
- Sem migração: a tabela `usuario` já tem `perfil` e `ativo`.

### "Atualizado em" nas medições

A tabela `medicao` guarda quem lançou, mas não quando. É a **única migração do M7** (Giovana), feita logo no começo, antes dos testes de ponta a ponta. Medições que já existem recebem a data da migração.

### Testes de ponta a ponta com Playwright, no CI

- **Ferramenta:** `@playwright/test`, numa pasta `e2e/` na raiz, com o próprio `package.json` (front e back não ganham dependência nova por causa disso).
- **Contra o sistema de verdade:** os testes abrem o front em `:8080`, que fala com a API em `:3000` e o banco do `docker compose`. Nada de mock.
- **No CI:** um passo novo no workflow `compose.yml`, depois das verificações que já existem. PR com E2E vermelho não é revisado, como já vale para o resto.
- **Dois tamanhos de tela:** desktop (1280 px) e celular (390 px). O teste do celular também é teste da E18.
- **Dados:** quem cria dados no teste usa um período que a carga não tem (por exemplo 2031/1) e não depende da ordem dos outros testes. A lição da #234 vale aqui: nenhum teste conta "todas as medições" do banco.
- **Rodar local:** num projeto separado do Compose (`docker compose -p ot-e2e up --build`), para não sujar o banco de quem está desenvolvendo. O passo a passo vai no README.

## Regra de "pronto" (a mesma do M4 ao M6)

Uma entrega só conta como implementada quando:

1. O código está na `main`: o PR foi revisado por outra pessoa, mergeado na `develop`, e a `develop` foi levada para a `main` numa versão validada;
2. Os testes automatizados existem e passam no CI (no M7, inclusive os de ponta a ponta);
3. Roda com `docker compose up --build`, sem passo manual escondido;
4. Quem abriu o PR sabe explicar o que o código faz.

E nada do que funcionava no M6 pode quebrar. Achou algo quebrado? Não conserte por conta própria no meio do seu PR: abra a issue de bug, para ela entrar na lista e no relatório.

## Como reportar um bug

1. Abra uma issue com o modelo **Bug** (o Christian cria até terça, 03/11): como reproduzir, o que era esperado, o que aconteceu, onde (tela, tamanho, navegador) e um print. Cite o caso do plano de testes (`CT-xx`) se houver.
2. Coloque o rótulo `bug` e o milestone "Milestone 7". Não atribua a ninguém.
3. O Christian faz a triagem no domingo, 08/11 (e antes, se for grave): prioridade, quem corrige (em geral quem fez a parte) e prazo.
4. A correção vem com um teste que falhava antes dela. O teste de ponta a ponta que achou o bug fica marcado com `test.fixme` até a correção entrar, e volta a rodar no PR da correção.

## Como ler as dependências

As mesmas etiquetas do M6: **[livre]** começa já, **[depende de: Fulano, o quê]** espera alguém (adiante com mock ou outra tarefa), **[bloqueia: Fulano]** tem gente esperando (prioridade máxima, avise no grupo quando mergear). No quadro, a dependência também está marcada na issue.

## Mapa de dependências

| Quem entrega | O quê | Até | Quem está esperando |
|---|---|---|---|
| Christian | Milestone 7 no GitHub, issues e quadro | Dom 01/11 | **Todos** |
| Christian e Giovana | Contrato do M7 em `docs/contrato-api.md` | Ter 03/11 | Maria Clara, Giovana, Christian |
| Christian | Base do Playwright e job no CI | Ter 03/11 | **Todos** (testes de ponta a ponta) |
| Christian | Modelo de issue de bug | Ter 03/11 | **Todos** |
| Christian | Plano de testes | Qua 04/11 | **Todos** (casos de cada área) |
| Giovana | Migração `atualizado_em` | Qua 04/11 | Giovana (API) |
| Christian | API de usuários | Qua 04/11 | Maria Clara (tela Usuários) |
| Maria Clara | Limite de tentativas no login | Qua 04/11 | Samuel (E2E do login) |
| Samuel | Menu do celular | Qua 04/11 | Maria Clara (E2E do portal no celular) |
| Karolina | Auditoria de acessibilidade | Qui 05/11 | Karolina (correções), todos (bugs da própria tela) |
| Giovana | "Atualizado em" na API | Qui 05/11 | Giovana (tela), Maria Clara (E2E do dashboard) |
| Maria Clara | Tela Usuários | Sex 06/11 | Giovana (E2E de usuários), Samuel (painel no celular) |
| Todos | Testes de ponta a ponta da parte de outro, com os bugs abertos | Sáb 07/11 | Christian (triagem) |
| Christian | Triagem dos bugs e distribuição | Dom 08/11 | **Todos** (correções) |
| Todos | Correções mergeadas e E2E verde | Ter 10/11 | Christian (congelar a `main`) |
| Christian | `develop → main` | Qua 11/11 | Samuel (máquina limpa), gravações |
| Todos | Gravação da própria parte do vídeo | Qui 12/11, 12h | Christian (edição) |

O caminho crítico é: **base do Playwright → testes de cada área → bugs → triagem → correções → `main`**. A lição do M6 vale de novo: quem está no fim da fila (a tela Usuários e o E2E da Giovana, que depende dela) começa já, com mock.

## Calendário

| Dia | O que precisa acontecer |
|---|---|
| Dom 01/11 | Milestone 7, issues e quadro no GitHub. |
| Seg 02/11 | Finados. Nada obrigatório; quem puder adianta o que é **[livre]**. |
| Ter 03/11 | Reunião curta de início (online, 30 min). Contrato do M7, base do Playwright no CI, modelo de bug e página 404. |
| Qua 04/11 | Plano de testes. Migração `atualizado_em`, API de usuários, limite de login e menu do celular. |
| Qui 05/11 | "Atualizado em" na API, tabela de Indicadores no celular e a auditoria de acessibilidade. |
| Sex 06/11 | Tela Usuários. Orientação com o professor (não obrigatória): levar dúvidas sobre o relatório do M7. |
| Sáb 07/11 | **Testes de ponta a ponta prontos**, com cada falha aberta como bug. "Atualizado em" nas telas, axe no E2E, painel no celular. |
| Dom 08/11 | **Triagem:** o Christian distribui as correções. |
| Seg 09 e Ter 10/11 | Correções (com teste), acessibilidade corrigida. Na terça, **integração**: tudo mergeado e o E2E verde no CI. |
| Qua 11/11 | **Congelamento:** `develop → main`. Samuel clona do zero e segue o README numa máquina limpa. |
| Qui 12/11 | Gravação até 12h. Christian edita à tarde, sobe e fecha o relatório. |
| Sex 13/11 | Entrega. |

Travou? Avise no grupo no mesmo dia. Quem terminar antes pega bug da lista.

## Git (o mesmo do M4 ao M6)

Detalhe em `docs/fluxo-de-trabalho.md`. Branch por tarefa a partir da `develop`, no padrão `tipo/Entrega-issue-descricao`: `test/E19-<issue>-e2e-portal`, `fix/E18-<issue>-menu-celular`, `feat/E13-<issue>-usuarios`... PR para a `develop`, com o modelo preenchido, `Closes #N` e prints em `docs/evidencias/pr-N/` quando muda tela. **Uma migração no M7**, a da Giovana.

## Contrato da API (o que muda; fecha em `docs/contrato-api.md` até ter 03/11)

Se algo abaixo mudar na revisão do contrato, vale o `docs/contrato-api.md`.

### Limite de tentativas no login

- Depois de **5 tentativas erradas** do mesmo IP em 15 minutos, `POST /api/auth/login` devolve `429` com `{ "erro": "Muitas tentativas de login. Tente de novo em alguns minutos." }` e o cabeçalho `Retry-After`. Login certo não conta.
- Limite e janela vêm de variáveis com padrão (`LOGIN_MAX_TENTATIVAS`, `LOGIN_JANELA_MINUTOS`), no `.env.example`, no `docker-compose.yml` e no `ci.yml`.
- A tela de login mostra a mensagem do `429` como mostra a do `401`.

### Usuários (só administrador; editor → `403` com `{ "erro": "Só o administrador gerencia usuários" }`)

```
GET    /api/admin/usuarios
POST   /api/admin/usuarios        { nome, email, senha, perfil }
PATCH  /api/admin/usuarios/:id    { perfil?, ativo?, senha? }
```

- Nenhuma resposta traz `senha_hash`. Cada usuário sai com `id`, `nome`, `email`, `perfil` e `ativo`, em ordem de nome.
- `POST`: `201`. E-mail repetido → `409` com `{ "erro": "Já existe um usuário com este e-mail" }`. Perfil fora de `administrador`/`editor`, e-mail inválido ou senha com menos de 8 caracteres → `400`.
- `PATCH`: `200` com o usuário. Desativar a si mesmo ou tirar o próprio perfil de administrador → `409` com `{ "erro": "Você não pode desativar nem rebaixar o próprio usuário" }`. Id inexistente → `404`.
- Não existe `DELETE`.

### Atualizado em

- Migração `medicao_atualizado_em`: `criado_em TIMESTAMP NOT NULL DEFAULT now()` e `atualizado_em TIMESTAMP NOT NULL` (`@updatedAt` no Prisma).
- `GET /api/admin/indicadores`: cada medição ganha `atualizado_em` (ISO 8601) e `lancado_por` (o `nome` do usuário).
- Público: **não** muda a resposta de `/api/indicadores` nem de `/api/indicadores/destaques`, para o CI que compara o mock com a API continuar valendo. Uma rota nova, `GET /api/indicadores/atualizacao` (com os mesmos filtros `setor`, `ano` e `semestre`), devolve `{ "atualizado_em": "<data>" }` com a data mais recente entre as medições **publicadas** que o filtro alcança, ou `null`. Rascunho não conta.

## Vídeo (cerca de 5 min, todos falam)

Cada um grava a própria parte. **De novo quem edita é o Christian.** O roteiro com as falas sai na quarta, 11/11.

| Tempo | Quem | O que mostra |
|---|---|---|
| 0:00 a 1:00 | Christian | O que é o M7 (testes, 95%), o plano de testes, o E2E rodando no CI e a lista de bugs no quadro |
| 1:00 a 2:00 | Giovana | O E2E de publicação e perfis rodando (com `--headed`), um bug que ele achou, e o "Atualizado em" no dashboard |
| 2:00 a 3:00 | Maria Clara | O login bloqueando na sexta tentativa, a tela Usuários criando um editor, e o E2E do portal no celular |
| 3:00 a 4:00 | Karolina | A navegação só pelo teclado, o relatório do axe antes e depois, e o E2E de relatórios com o download |
| 4:00 a 5:00 | Samuel | O site no celular (menu, tabela, painel), a página 404 e o E2E do painel. Fechamento: o que vem no M8 |

## Relatório do M7

Se o professor mandar um modelo novo no Teams, vale o modelo. Se for o mesmo dos milestones anteriores: E18 e E19 marcadas (19 de 20), o plano de testes, os números (quantos testes de unidade, de API e de ponta a ponta, a cobertura e quantos bugs foram achados e corrigidos), e as três dívidas, explicando que os perfis e o cadastro de usuários não são pedidos pela Proposta e por que entraram.

## Uso de IA (as mesmas regras)

- Dê contexto: cole o plano de testes, o trecho do contrato e o componente testado. Sem contexto, a IA inventa seletor e texto que não existem na tela.
- Teste de ponta a ponta gerado por IA tem um defeito típico: passa sempre. Antes do PR, quebre a tela ou a rota de propósito e veja o teste falhar.
- Prefira seletores pelo que o usuário vê (`getByRole`, `getByLabel`, `getByText`), não por classe CSS. Isso também testa a acessibilidade.
- Nunca cole senha, token, chave de API ou `.env` na IA.
- O uso de IA é contado no vídeo, não no PR nem nos commits.

## Olhando adiante (Milestone 8, sexta 27/11)

Manutenção: versão final empacotada, documentação e manual do painel (E20, Maria Clara e Christian), ajustes de usabilidade apontados nos testes, revisão dos dados publicados (Giovana) e, se sobrar fôlego, busca por título e "Visualizar" na página de relatórios e a página informativa do Cadastur e da FNRH. Apresentação em 04/12: o professor pode perguntar qualquer parte para qualquer pessoa.
