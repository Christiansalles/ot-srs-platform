# Fluxo de trabalho do grupo

## Branches

Temos duas branches fixas, e nenhuma aceita push direto:

- **`develop`:** onde o trabalho do dia a dia se junta. Toda branch de tarefa sai da `develop`, e o PR da tarefa volta para ela, com 1 aprovação e CI verde.
- **`main`:** só recebe versões validadas. Quando a `develop` tem uma versão funcional, testada e aprovada, abrimos um PR `develop → main`, também com 1 aprovação e CI verde. A `main` é o que o professor avalia.

```
feat/E3-14-rotas-indicadores ──PR──► develop ──PR (versão validada)──► main
```

Para começar uma tarefa:

```bash
git switch develop
git pull
git switch -c feat/E3-14-rotas-indicadores
```

Uma branch por tarefa, no padrão `tipo/Entrega-issue-descricao`:

```
feat/E2-7-schema
feat/E3-14-rotas-indicadores
fix/E4-21-card-sem-valor
test/E3-15-variacao-percentual
```

- **tipo:** `feat` (funcionalidade), `fix` (correção), `test` (só testes), `docs` (documentação), `chore` (configuração, dependências, estrutura).
- **Entrega:** `E1` a `E5`, a entrega do Milestone a que a tarefa pertence.
- **issue:** número da issue no quadro do GitHub Projects.
- **descricao:** poucas palavras, minúsculas, com hífen.

Não usamos o nome da pessoa na branch. O autor já fica registrado no commit e no PR, e o responsável fica na issue. Várias entregas são feitas em dupla, então o nome na branch acabaria confundindo.

A primeira branch (`feat/E1-esqueleto`) não tem número porque foi criada antes do quadro existir. Ela também é a única que vai direto para a `main`, porque a `develop` nasce a partir dela.

## Commits

Mensagem curta, no imperativo, com o mesmo prefixo de tipo:

```
feat(backend): adiciona rota /api/setores
test(backend): cobre medição em rascunho
fix(frontend): corrige formato da variação no card
```

## Pull requests

- **Base certa.** PR de tarefa aponta para a `develop`, não para a `main`. No GitHub, confira o campo "base" antes de criar.
- **Pequeno.** PR pequeno é revisado rápido.
- **Descrição com três partes:**
  1. O que faz.
  2. Como testar (comandos ou passos).
  3. Qualquer informação adicional que ajude a entender o contexto.
- **`Closes #N`** na descrição, para a issue fechar sozinha no merge e o quadro se atualizar.
- **Revisor:** o da tabela da visão geral do Milestone. Quem revisa roda o código, não só lê.
- Depois do merge, apague a branch e avise no grupo se a tarefa bloqueava alguém.

## Regra de "pronto"

Uma tarefa só conta como pronta quando:

1. O código está na `main`: o PR da tarefa foi revisado por outra pessoa e mergeado na `develop`, e depois a `develop` foi levada para a `main` numa versão validada.
2. Os testes automatizados dela existem e passam no CI.
3. Roda com `docker compose up --build`, sem passo manual escondido.
4. Quem abriu o PR sabe explicar a tarefa feita.

Testes são feitos **junto** com a funcionalidade, não depois.

## Uso de IA

- Dê contexto: o trecho do DER, o [contrato da API](contrato-api.md) ou o HTML do mockup do Stitch. Sem contexto, a IA inventa.
- Peça os testes junto com o código.
- Nunca cole senha, token ou `.env` na IA.
- Leia e rode antes de abrir o PR. "A IA fez" não é resposta.
