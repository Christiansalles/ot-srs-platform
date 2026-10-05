# Contrato da API

O front programa contra este contrato desde o primeiro dia, usando mocks no mesmo formato. Qualquer mudança aqui passa por PR e precisa ser avisada no grupo, porque quebra o front.

Base: `http://localhost:3000`. Todas as respostas são JSON.

## Regras gerais

- **Só conteúdo publicado.** O portal público só mostra medições com `status = 'publicado'`. Medição em `rascunho` nunca aparece em nenhuma rota.
- **Ids.** A API usa `id` em todos os objetos. No banco as colunas se chamam `id_setor`, `id_indicador`, `id_periodo` etc. (DER do Milestone III).
- **`valor` é número.** No banco ele é `NUMERIC(12,2)`, que o Prisma devolve como `Decimal`, e o `Decimal` vira texto no JSON. A API converte para `number` antes de responder.
- **Ordem.** Listas de setores e indicadores em ordem alfabética de `nome`. Períodos e medições em ordem cronológica (`ano`, depois `semestre`).

## Rotas

### `GET /api/health`

```json
{ "status": "ok" }
```

### `GET /api/setores`

```json
[ { "id": 1, "nome": "Hospedagem" } ]
```

### `GET /api/periodos`

```json
[ { "id": 1, "ano": 2025, "semestre": 1 } ]
```

### `GET /api/indicadores?setor=1&ano=2025&semestre=1`

Os parâmetros `setor`, `ano` e `semestre` são opcionais.

* `setor`: filtra os indicadores de um setor específico.
* `ano`: filtra as medições de um ano específico.
* `semestre`: filtra as medições de um semestre específico (`1` ou `2`).

Sem filtros, a rota mantém o comportamento definido no Milestone IV e devolve os indicadores de todos os setores, com suas medições publicadas.

Os filtros podem ser combinados. Por exemplo:

```text
GET /api/indicadores?setor=1&ano=2025&semestre=1
```

Quando `ano` e `semestre` são informados, apenas as medições publicadas daquele período são retornadas.

Se o período for válido, mas não houver dados para os filtros informados, a resposta é `200` com lista vazia `[]`.

```json
[
  {
    "id": 3,
    "nome": "Leitos",
    "unidade": "leitos",
    "setor": { "id": 1, "nome": "Hospedagem" },
    "medicoes": [
      { "ano": 2024, "semestre": 2, "valor": 1234 },
      { "ano": 2025, "semestre": 1, "valor": 1280 }
    ]
  }
]
```

### `GET /api/indicadores/destaques?setor=1&ano=2025&semestre=1`

Os parâmetros `setor`, `ano` e `semestre` são opcionais.

* `setor`: filtra os indicadores de um setor específico.
* `ano`: seleciona o ano do período do destaque.
* `semestre`: seleciona o semestre do período do destaque (`1` ou `2`).

Sem filtros, a rota mantém o comportamento definido no Milestone IV: um item por indicador, com o valor do período publicado mais recente.

Quando `ano` e `semestre` são informados, o destaque usa o valor da medição publicada naquele período. Indicadores que não possuem medição publicada no período escolhido ficam de fora da resposta.

A `variacao_percentual` continua sendo calculada em relação à medição publicada anterior do mesmo indicador, mesmo que essa medição esteja fora do período filtrado.

Se o período for válido, mas não houver dados para os filtros informados, a resposta é `200` com lista vazia `[]`.

Exemplo:

```text
GET /api/indicadores/destaques?setor=1&ano=2025&semestre=1
```

```json
[
  {
    "id": 3,
    "nome": "Leitos",
    "unidade": "leitos",
    "valor": 1280,
    "periodo": { "ano": 2025, "semestre": 1 },
    "variacao_percentual": 3.7
  }
]
```

`variacao_percentual` é calculada na consulta e **não** é guardada no banco (nota do DER do Milestone III):

```
variacao_percentual = (valor_atual - valor_anterior) / valor_anterior * 100
```

- "Anterior" é a medição publicada mais recente do mesmo indicador em um período anterior ao atual. Não precisa ser o semestre imediatamente anterior: se o indicador tem 2024/2 e 2025/2, a variação de 2025/2 compara com 2024/2.
- Arredondada para 1 casa decimal. No exemplo: (1280 - 1234) / 1234 * 100 = 3,73 → `3.7`.
- Se não existe medição anterior, ou se o valor anterior é 0, vem `null`.

Os números acima mostram só o formato. Os da carga (`backend/prisma/dados/hospedagem.json`) são ilustrativos, tirados dos mockups do Milestone III no Stitch, porque o Relatório OT nº 004/2025 não está disponível para o grupo. Os dados oficiais virão depois da Prefeitura (SMCELT), e aí só esse arquivo muda.

## Casos de borda (decididos)

Cada item vira um teste da API (#10).

- [x] **Setor que não existe** (`GET /api/indicadores?setor=999`): `200` com lista vazia `[]`. É um filtro sem resultado, não um erro; o front mostra o estado "sem dados".
- [x] **`setor` inválido** (`?setor=abc`, `?setor=1.5`, `?setor=-1`): `400` com `{ "erro": "setor deve ser um número inteiro positivo" }`. Ignorar o filtro esconderia bug do front, que veria dados de todos os setores.
- [ ] **`ano` inválido** (`?ano=25`, `?ano=202`, `?ano=20255`, `?ano=abc`, `?ano=1.5`): `400` com `{ "erro": "..." }`. O ano deve ser um número inteiro com 4 dígitos.
- [ ] **`semestre` inválido** (`?semestre=0`, `?semestre=3`, `?semestre=abc`): `400` com `{ "erro": "..." }`. O semestre deve ser `1` ou `2`.
- [ ] **Período válido sem dados** (`?ano=2020&semestre=1`): `200` com lista vazia `[]`. Um período válido sem dados é considerado um filtro sem resultado, não um erro.
- [x] **Indicador sem nenhuma medição publicada:** fica de fora da lista, tanto em `/api/indicadores` quanto em `/api/indicadores/destaques`. Segue a regra de só mostrar o que está publicado e evita linha vazia na tabela e card sem número.
- **Distribuição por setor e comparativo anual:** não possuem rotas específicas. O front monta essas informações a partir dos dados retornados por `/api/indicadores`.

## Erros

Formato combinado com a base do Express:

```json
{ "erro": "mensagem legível" }
```
