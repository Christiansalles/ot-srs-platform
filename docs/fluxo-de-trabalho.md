# Fluxo de trabalho do grupo

## Branches

A `main` é protegida. Nada entra direto: só por pull request com 1 aprovação e CI verde.

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

A primeira branch (`feat/E1-esqueleto`) não tem número porque foi criada antes do quadro existir.

## Commits

Mensagem curta, no imperativo, com o mesmo prefixo de tipo:

```
feat(backend): adiciona rota /api/setores
test(backend): cobre medição em rascunho
fix(frontend): corrige formato da variação no card
```

## Pull requests

- **Pequeno.** PR pequeno é revisado rápido. PR de 2 mil linhas não é revisado de verdade.
- **Descrição com três partes:**
  1. O que faz.
  2. Como testar (comandos ou passos).
  3. Uso de IA: o que foi gerado e o que foi ajustado à mão. Isso alimenta a seção 6 do relatório.
- **`Closes #N`** na descrição, para a issue fechar sozinha no merge e o quadro se atualizar.
- **Revisor:** o da tabela da visão geral do Milestone. Quem revisa roda o código, não só lê.
- Depois do merge, apague a branch e avise no grupo se a tarefa bloqueava alguém.

## Regra de "pronto"

Uma tarefa só conta como pronta quando:

1. O código está na `main`, via pull request revisado por outra pessoa.
2. Os testes automatizados dela existem e passam no CI.
3. Roda com `docker compose up --build`, sem passo manual escondido.
4. Quem abriu o PR sabe explicar o que o código faz, principalmente o que veio de IA.

Testes são feitos **junto** com a funcionalidade, não depois.

## Uso de IA

- Dê contexto: o trecho do DER, o [contrato da API](contrato-api.md) ou o HTML do mockup do Stitch. Sem contexto, a IA inventa.
- Peça os testes junto com o código.
- Nunca cole senha, token ou `.env` na IA.
- Leia e rode antes de abrir o PR. "A IA fez" não é resposta se o professor perguntar.

## Travou?

Avise no grupo no mesmo dia, não na véspera. Quem terminar antes ajuda quem está atolado.
