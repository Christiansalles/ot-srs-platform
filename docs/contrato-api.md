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

### `GET /api/indicadores?setor=1&ano=2025&semestre=2`

Os parâmetros `setor`, `ano` e `semestre` são opcionais.

- `setor`: filtra os indicadores de um setor específico.
- `ano`: filtra as medições de um ano específico.
- `semestre`: filtra as medições de um semestre específico (`1` ou `2`).

Sem filtros, a rota mantém o comportamento definido no Milestone IV e devolve os indicadores de todos os setores, com suas medições publicadas.

Os filtros podem ser combinados.

Quando apenas `ano` é informado, todas as medições publicadas daquele ano são retornadas, incluindo os dois semestres quando houver dados.

Por exemplo:

```text
GET /api/indicadores?ano=2025
```

Quando `ano` e `semestre` são informados, apenas as medições publicadas daquele período são retornadas.

Se `semestre` for informado sem `ano`, a API retorna `400` com o erro definido neste contrato.

Um indicador que não possuir nenhuma medição publicada no período filtrado fica de fora da resposta. Não deve ser retornado com `medicoes: []`.

Se o período for válido, mas não houver dados para os filtros informados, a resposta é `200` com lista vazia `[]`.

```json
[
  {
    "id": 3,
    "nome": "Leitos",
    "unidade": "leitos",
    "setor": { "id": 1, "nome": "Hospedagem" },
    "medicoes": [
      { "ano": 2025, "semestre": 2, "valor": 350 }
    ]
  }
]
```

### `GET /api/indicadores/destaques?setor=1&ano=2025&semestre=2`

Os parâmetros `setor`, `ano` e `semestre` são opcionais.

- `setor`: filtra os indicadores de um setor específico.
- `ano`: seleciona o ano do período do destaque.
- `semestre`: seleciona o semestre do período do destaque (`1` ou `2`).

Sem filtros, a rota mantém o comportamento definido no Milestone IV: um item por indicador, com o valor do período publicado mais recente.

Quando apenas `ano` é informado, o destaque usa o semestre mais recente daquele ano que possua medição publicada para o indicador.

Por exemplo:

```text
GET /api/indicadores/destaques?ano=2025
```

Se um indicador possuir medição publicada em 2025/1 e 2025/2, o destaque utiliza a medição de 2025/2.

Quando `ano` e `semestre` são informados, o destaque usa o valor da medição publicada naquele período.

Indicadores que não possuem medição publicada no período escolhido ficam de fora da resposta.

A `variacao_percentual` continua sendo calculada em relação à medição publicada anterior do mesmo indicador, mesmo que essa medição esteja fora do período filtrado.

Se o período for válido, mas não houver dados para os filtros informados, a resposta é `200` com lista vazia `[]`.

```json
[
  {
    "id": 3,
    "nome": "Leitos",
    "unidade": "leitos",
    "valor": 350,
    "periodo": { "ano": 2025, "semestre": 2 },
    "variacao_percentual": 12.2
  }
]
```

`variacao_percentual` é calculada na consulta e **não** é guardada no banco (nota do DER do Milestone III):

```text
variacao_percentual = (valor_atual - valor_anterior) / valor_anterior * 100
```

- "Anterior" é a medição publicada mais recente do mesmo indicador em um período anterior ao atual. Não precisa ser o semestre imediatamente anterior: se o indicador tem 2023/2 e 2024/2, a variação de 2024/2 compara com 2023/2.

- Arredondada para 1 casa decimal. Por exemplo, em `GET /api/indicadores/destaques?ano=2024`, se o valor atual for 312 em 2024/2 e o anterior for 280 em 2023/2:

```text
(312 - 280) / 280 * 100 = 11,4%
```

- Se não existe medição anterior, ou se o valor anterior é 0, vem `null`.

Os números acima mostram só o formato. Os da carga (`backend/prisma/dados/hospedagem.json`) são ilustrativos, tirados dos mockups do Milestone III no Stitch, porque o Relatório OT nº 004/2025 não está disponível para o grupo. Os dados oficiais virão depois da Prefeitura (SMCELT), e aí só esse arquivo muda.

## Distribuição por setor e comparativo anual

Não existem rotas específicas para distribuição por setor ou comparativo anual.

O front monta essas informações a partir dos dados retornados por `/api/indicadores`.

## Casos de borda (decididos)

Cada item vira um teste da API (#10).

- [x] **Setor que não existe** (`GET /api/indicadores?setor=999`): `200` com lista vazia `[]`. É um filtro sem resultado, não um erro; o front mostra o estado "sem dados".

- [x] **`setor` inválido** (`?setor=abc`, `?setor=1.5`, `?setor=-1`): `400` com `{ "erro": "setor deve ser um número inteiro positivo" }`. Ignorar o filtro esconderia bug do front, que veria dados de todos os setores.

- [ ] **`ano` inválido** (`?ano=25`, `?ano=202`, `?ano=20255`, `?ano=abc`, `?ano=1.5`): `400` com `{ "erro": "ano deve ser um número inteiro de 4 dígitos" }`.

- [ ] **`semestre` inválido** (`?semestre=0`, `?semestre=3`, `?semestre=abc`): `400` com `{ "erro": "semestre deve ser 1 ou 2" }`.

- [ ] **`semestre` informado sem `ano`** (`?semestre=2`): `400` com `{ "erro": "semestre exige ano" }`.

- [ ] **Período válido sem dados** (`?ano=2020&semestre=1`): `200` com lista vazia `[]`. Um período válido sem dados é considerado um filtro sem resultado, não um erro.

- [x] **Indicador sem nenhuma medição publicada:** fica de fora da lista, tanto em `/api/indicadores` quanto em `/api/indicadores/destaques`. Segue a regra de só mostrar o que está publicado e evita linha vazia na tabela e card sem número.

## Erros

Formato combinado com a base do Express:

```json
{ "erro": "mensagem legível" }
```
