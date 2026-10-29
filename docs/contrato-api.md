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

## Autenticação

### `POST /api/auth/login`

Autentica um usuário ativo. O e-mail é removido de espaços nas extremidades e convertido para minúsculas antes da consulta.

Requisição:

```json
{ "email": "admin@observatorio.local", "senha": "sua-senha" }
```

Em caso de sucesso, responde `200` com o token e os dados públicos do usuário, incluindo `perfil` (`administrador` ou `editor`):

```json
{
  "token": "<jwt>",
  "usuario": {
    "id": 1,
    "nome": "Administrador",
    "email": "admin@observatorio.local",
    "perfil": "administrador"
  }
}
```

O token é assinado com HS256 e expira em 8 horas. Ele pode levar o perfil como claim, mas quem decide o acesso é o perfil lido do banco a cada requisição (veja "Perfis e rotas administrativas"). `senha_hash` nunca é enviado ao cliente.

Erros:

- `400` quando e-mail ou senha estiverem ausentes, vazios ou não forem texto: `{ "erro": "E-mail e senha são obrigatórios" }`.
- `400` quando o corpo não for JSON válido: `{ "erro": "JSON inválido" }`.
- `401` para e-mail inexistente, senha incorreta ou usuário inativo: `{ "erro": "E-mail ou senha inválidos" }`.
- `500` se ocorrer uma falha interna, incluindo `JWT_SECRET` não configurada: `{ "erro": "Erro interno do servidor" }`.

### `GET /api/auth/me`

Retorna os dados públicos do usuário associado ao token. Envie o token no cabeçalho `Authorization` como `Bearer <jwt>`.

Em caso de sucesso, responde `200` diretamente com o objeto do usuário:

```json
{
  "id": 1,
  "nome": "Administrador",
  "email": "admin@observatorio.local",
  "perfil": "administrador"
}
```

Responde `401` se o token estiver ausente, inválido ou expirado, ou se o usuário associado estiver inativo:

```json
{ "erro": "Token inválido ou expirado" }
```

`senha_hash` não aparece na resposta.

## Perfis e rotas administrativas

O login e `/api/auth/me` incluem `perfil` no objeto `usuario`. Os valores permitidos são `administrador` e `editor`, os dois da equipe da SMCELT:

- `administrador`: cadastra e edita indicadores e medições, sobe PDFs, **publica e despublica**;
- `editor`: cadastra e edita indicadores e medições e sobe PDFs, sempre como rascunho. **Não publica nem despublica.**

Tudo o que é cadastrado ou enviado pelo painel nasce como `rascunho`. O status só muda pelas rotas `PATCH .../status`, que são exclusivas do administrador. Nenhuma rota de cadastro ou edição aceita `status` no corpo; se vier, é ignorado.

Todas as rotas em `/api/admin/*` exigem `Authorization: Bearer <jwt>` de um usuário ativo; token ausente, inválido ou expirado responde `401`. O middleware `autenticar` já busca o usuário no banco a cada requisição, então a checagem de perfil (`exigirPerfil`) usa `req.usuario.perfil`: se o perfil mudar no banco, vale na próxima requisição. O perfil pode estar no JWT, mas não é ele que decide o acesso.

Editor chamando uma rota de status responde `403`:

```json
{ "erro": "Seu perfil não pode publicar conteúdo" }
```

### Indicadores e medições

#### `GET /api/admin/indicadores?setor=1&status=rascunho`

Retorna todos os indicadores, inclusive os sem medições, ordenados por nome. Cada item inclui `id`, `nome`, `unidade`, `descricao`, setor `{ id, nome }` e `medicoes`, com **todas** as medições (rascunho e publicadas), ordenadas por ano e semestre. Cada medição inclui `id`, `ano`, `semestre`, `valor` (número) e `status`. A resposta não expõe `id_usuario`.

Filtros opcionais e combináveis:

- `setor`: só os indicadores daquele setor. Mesma validação da rota pública: fora de inteiro positivo, `400` com `{ "erro": "setor deve ser um número inteiro positivo" }`.
- `status`: só as medições com aquele status (`rascunho` ou `publicado`); indicador sem nenhuma medição nesse status fica de fora. Qualquer outro valor responde `400` com `{ "erro": "Status inválido" }`.

```json
[
  {
    "id": 3,
    "nome": "Leitos",
    "unidade": "leitos",
    "descricao": null,
    "setor": { "id": 1, "nome": "Hospedagem" },
    "medicoes": [
      { "id": 7, "ano": 2025, "semestre": 2, "valor": 350, "status": "rascunho" }
    ]
  }
]
```

#### `POST /api/admin/indicadores`

Cria indicador. Corpo: `{ "id_setor": 1, "nome": "Leitos", "descricao": null, "unidade": "leitos" }`. `id_setor`, `nome` (até 80 caracteres) e `unidade` (até 20) são obrigatórios; `descricao` é opcional (até 200) e pode ser `null`. Responde `201` com o indicador criado. Setor inexistente ou campo obrigatório faltando ou inválido responde `400`.

#### `PUT /api/admin/indicadores/:id`

Atualiza `id_setor`, `nome`, `descricao` e `unidade`, com as mesmas regras do `POST`. Responde `200` com o indicador atualizado; id inexistente responde `404`.

#### `POST /api/admin/medicoes`

Cria medição. Corpo: `{ "id_indicador": 3, "ano": 2025, "semestre": 2, "valor": 350 }`.

- `id_indicador`: inteiro positivo de um indicador existente;
- `ano`: inteiro de quatro dígitos; `semestre`: `1` ou `2`;
- `valor`: número finito compatível com `NUMERIC(12,2)`.

Responde `201` com a medição, sempre com `"status": "rascunho"`. A API grava `id_usuario` com o usuário logado e, se o período (`ano`, `semestre`) ainda não existe, cria o período.

Já existir medição desse indicador nesse ano e semestre responde `409` (o banco tem `@@unique([id_indicador, id_periodo])`; a rota converte o erro do Prisma em `409`, nunca em `500`):

```json
{ "erro": "Já existe uma medição deste indicador em 2025/2" }
```

#### `PUT /api/admin/medicoes/:id`

Atualiza `valor` e, se vierem, `ano` e `semestre`, com as mesmas validações e a mesma regra do `409` do `POST`. O indicador da medição não muda. Responde `200` com a medição atualizada; id inexistente responde `404`.

Medição publicada não se edita direto: o administrador despublica, alguém corrige e ele publica de novo. Editar uma medição com `status = 'publicado'` responde `409`:

```json
{ "erro": "Despublique a medição antes de editar" }
```

#### `PATCH /api/admin/medicoes/:id/status`

Só `administrador`. Corpo: `{ "status": "publicado" }` ou `{ "status": "rascunho" }`. Responde `200` com a medição atualizada. Editor responde `403`; status fora de `rascunho`/`publicado` responde `400` (`"Status inválido"`); id inexistente responde `404`.

### Relatórios

Categorias válidas (as do mockup da Tela 8): `Perfil de Demanda`, `Setor Hoteleiro`, `Impacto Econômico` e `Diagnóstico Estratégico`. Os filtros e o cadastro aceitam só esses valores, escritos exatamente assim.

#### `GET /api/relatorios?ano=2025&categoria=Setor%20Hoteleiro`

Rota pública. Os filtros `ano` e `categoria` são opcionais e combináveis. `ano` filtra pelo ano de `data_publicacao`, com a mesma validação de quatro dígitos das rotas de indicadores; categoria fora da lista responde `400` (`"Categoria inválida"`). Filtro válido sem resultados responde `200` com `[]`.

Retorna somente relatórios publicados, do mais recente para o mais antigo (`data_publicacao` decrescente). Relatórios com a mesma data saem pelo `id` decrescente, ou seja, o cadastrado por último vem primeiro:

```json
[
  {
    "id": 1,
    "titulo": "Boletim ilustrativo de indicadores",
    "edicao": "2025/2",
    "categoria": "Setor Hoteleiro",
    "data_publicacao": "2026-10-20",
    "descricao": "Documento ilustrativo gerado pelo grupo a partir dos mockups do Milestone III.",
    "tamanho_kb": 182,
    "url_arquivo": "/api/relatorios/1/arquivo"
  }
]
```

`url_arquivo` é o caminho da rota de download (`/api/relatorios/:id/arquivo`), não do disco. A resposta nunca traz `arquivo_url` (o nome interno do arquivo) nem o usuário que cadastrou.

#### `GET /api/relatorios/:id/arquivo`

Rota pública que devolve o PDF de um relatório publicado, com:

```text
Content-Type: application/pdf
Content-Disposition: attachment; filename="<edição>-<título>.pdf"
```

O nome do arquivo é montado a partir de `edicao` e `titulo`, em minúsculas, sem acento e sem espaço (acentos removidos; qualquer caractere fora de `a-z` e `0-9` vira `-`, sem `-` repetido nem nas pontas). Exemplo: edição `2025/2` e título `Boletim ilustrativo de indicadores` → `2025-2-boletim-ilustrativo-de-indicadores.pdf`.

Relatório inexistente, em rascunho ou com o arquivo sumido responde `404` com `{ "erro": "Relatório não encontrado" }`, sem revelar que existe um rascunho.

#### `GET /api/admin/relatorios`

Lista os relatórios de qualquer status. Cada item tem os mesmos campos da rota pública, mais `status` (`rascunho` ou `publicado`).

#### `POST /api/admin/relatorios`

Cadastra relatório. Envie `multipart/form-data` com:

- `titulo`: obrigatório, até 150 caracteres;
- `edicao`: obrigatório, até 20 caracteres;
- `categoria`: obrigatório, uma das quatro categorias;
- `data_publicacao`: obrigatório, `YYYY-MM-DD`;
- `descricao`: obrigatório, até 500 caracteres;
- `arquivo`: obrigatório, o PDF.

Os limites de texto são os do `schema.prisma`; passar deles responde `400`, nunca `500`. O arquivo só é aceito se o tipo for `application/pdf` **e** o conteúdo começar com `%PDF`; senão, `400` (`"Arquivo PDF obrigatório"`). Acima de 10 MiB responde `413` (`"Arquivo muito grande"`), com o limite configurado no `multer`.

O servidor define `id_usuario`, `tamanho_kb`, `arquivo_url` e o status inicial, que é sempre `rascunho`. Responde `201` com o relatório no formato de `GET /api/admin/relatorios`, sem o caminho interno do arquivo.

Os PDFs ficam no diretório `uploads/` do backend, persistido no volume Docker `uploads` montado em `/app/uploads` (o mesmo da #164). O nome salvo é gerado pelo servidor, nunca o que veio do navegador. `arquivo_url` guarda só o caminho relativo dentro de `uploads/`. Ninguém acessa a pasta direto: o download passa pela rota, que confere o status.

#### `PATCH /api/admin/relatorios/:id/status`

Só `administrador`. Corpo: `{ "status": "publicado" }` ou `{ "status": "rascunho" }`. Responde `200` com o relatório atualizado. Editor responde `403`; status fora de `rascunho`/`publicado` responde `400` (`"Status inválido"`); id inexistente responde `404`.

### Erros das rotas administrativas e de relatórios

Erros seguem `{ "erro": "mensagem legível" }`.

- `400`: `"JSON inválido"`, `"Campos obrigatórios inválidos"` (campo ausente, com tipo errado ou acima do limite), `"Categoria inválida"`, `"Status inválido"`, `"Arquivo PDF obrigatório"`; filtros `setor` e `ano` com as mesmas mensagens das rotas de indicadores.
- `401`: token ausente, inválido ou expirado, ou usuário inativo: `"Token inválido ou expirado"`.
- `403`: editor tentando publicar ou despublicar: `"Seu perfil não pode publicar conteúdo"`.
- `404`: indicador, medição ou relatório inexistente no painel: `"Recurso não encontrado"`; no download público: `"Relatório não encontrado"`.
- `409`: medição duplicada: `"Já existe uma medição deste indicador em <ano>/<semestre>"`; edição de medição publicada: `"Despublique a medição antes de editar"`.
- `413`: upload acima de 10 MiB: `"Arquivo muito grande"`.

As rotas públicas de relatório nunca incluem rascunhos. Categoria desconhecida ou ano malformado responde `400`, em vez de ser ignorado.

## Erros

As respostas de erro da API usam o formato JSON combinado com a base do Express:

```json
{ "erro": "mensagem legível" }
```
