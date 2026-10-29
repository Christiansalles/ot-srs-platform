> Cópia do `Milestone6_Tarefas/00_Visao_Geral_M6.md`, mantido fora do repositório pelo grupo. Os caminhos `Stitch/Image N.html` correspondem aos arquivos de [`docs/referencias/stitch/`](../referencias/stitch/README.md), e `docs/pr-N` agora é `docs/evidencias/pr-N`. Os arquivos individuais citados aqui não foram copiados.

# Milestone 6: visão geral do grupo

**Entrega:** sexta, 30/10, assíncrona (o professor avalia sem a gente na frente).
**Meta:** 85% do projeto, ou seja, as entregas E1 a E17 prontas (17 de 20). No M6 entram E11 a E16.
**Fatia:** relatórios em PDF e painel administrativo completo. A equipe da SMCELT entra no painel, vê tudo o que está cadastrado e o status de cada item, cadastra e edita medições, sobe PDFs, publica e despublica. O público vê e baixa os relatórios publicados.

Cada um tem um arquivo próprio nesta pasta com as suas tarefas. Este aqui vale para todos.

---

## As entregas deste Milestone

| Entrega | O que é | Back-end | Front-end | Revisor do PR |
|---|---|---|---|---|
| E11 | Painel de gestão com a listagem dos indicadores e o status de cada um (Tela 6) | Maria Clara | Maria Clara | Christian (back) / Samuel (front) |
| E12 | Cadastro e edição de indicadores e medições, com bloqueio de medição duplicada no mesmo semestre (Tela 7) | Giovana | Maria Clara | Christian (back) / Samuel (front) |
| E13 | Publicação e despublicação de conteúdo, com perfis de usuário | Christian | Karolina | Giovana (back) / Samuel (front) |
| E14 | Upload de relatórios em PDF pelo painel (Tela 8) | Giovana | Maria Clara | Christian (back) / Samuel (front) |
| E15 | Página pública de relatórios, com filtro por ano e por categoria (Tela 4) | Christian (rota pública) | Samuel | Giovana (back) / Karolina (front) |
| E16 | Download dos relatórios em PDF | Giovana | Samuel | Christian (back) / Karolina (front) |

Fora das entregas numeradas, mas também do M6 (está no cronograma interno):

- **Karolina:** layout do painel (`AdminLayout`, menu lateral do mockup), o componente `StatusBadge` e o ajuste final da identidade visual em todas as telas, públicas e do painel.
- **Samuel:** revisão da responsividade das páginas públicas.
- **Maria Clara:** teste em máquina limpa (no M5 foi a Giovana) e README do painel.
- **Christian:** contrato, integração, relatório e, de novo, a edição do vídeo.

No quadro, a identidade visual da Karolina e a revisão de responsividade do Samuel estão marcadas como **E18**: são o começo dela, que só conta como implementada no M7 ou no M8, depois da revisão completa de responsividade e acessibilidade.

**Por que a Karolina entrou na E13:** no relatório do M5 a E13 estava só com o Christian. O back da publicação é pequeno (perfil, um middleware e duas rotas de status), e o front (botões, confirmação, esconder para quem não pode) fica no painel, que precisa do layout que ela faz. Assim a Maria Clara não fica com o painel inteiro sozinha. O Christian explica a mudança no relatório.

## Telas do Stitch de cada entrega

| Tela | Arquivo | Entrega |
|---|---|---|
| Tela 4 · Relatórios (público) | `Stitch/Image 2.html` (também `Image 10.html` e `Image 13.html`, bloco "Relatórios recentes") | E15, E16 |
| Tela 6 · Painel de gestão | `Stitch/Image 8.html` (tabela com "Publicado" e "Rascunho") | E11, E13 |
| Tela 7 · Cadastrar indicador | `Stitch/NovasTelas/Image 2 (1).html` | E12 |
| Tela 8 · Publicador de relatórios | `Stitch/NovasTelas/Image 2.html` | E14, E13 |

As outras telas de `NovasTelas/` (pesquisas de demanda, ocupação hoteleira mensal, cadastro de usuários do COMTUR) **não** entram no M6: são funcionalidades que a Proposta não pede.

## Perfis e publicação: o que vale (decidido pela Proposta)

O relatório do M5 diz que "os perfis de usuário chegam no Milestone VI", e as telas novas do Stitch mostram um status "Homologado" com o COMTUR homologando. Voltamos à fonte, a `Proposta_Prefeitura_SRS_Inatel.pdf`. Ela pede só um **"Painel administrativo: área simples para que a equipe da SMCELT atualize e publique novos dados"**. O COMTUR não aparece como quem aprova, e a validação antes da publicação só existe na coleta autônoma pelos estabelecimentos, que é desejável (fase 2).

Então, no M6:

- **Dois status**, como já está no banco: `rascunho` e `publicado`. **Sem "homologado" e sem COMTUR.** O público só vê o que está publicado (isso já vale desde o M4 e continua testado).
- **Dois perfis**, os dois da equipe da SMCELT:
  - `administrador`: cadastra, edita, sobe PDF, **publica e despublica**;
  - `editor`: cadastra, edita e sobe PDF, tudo como rascunho. Tentar publicar ou despublicar devolve `403`. No front, os botões nem aparecem para ele.
- Tudo o que é cadastrado ou enviado **nasce em rascunho**. Só o administrador leva para o público.
- Medição publicada não se edita direto: o administrador despublica, alguém corrige e ele publica de novo. Assim nenhum número muda no portal sem passar pelo administrador.
- Cadastro de usuários pelo painel **não** entra (o seed cria os dois usuários de desenvolvimento). Fica como dívida para o M7, se der.

## Regra de "pronto" (a mesma do M4 e do M5)

Uma entrega só conta como implementada quando:

1. O código está na `main`: o PR da tarefa foi revisado por outra pessoa e mergeado na `develop`, e a `develop` foi levada para a `main` numa versão validada;
2. Os testes automatizados dela existem e passam no CI;
3. Roda com `docker compose up --build`, sem passo manual escondido (inclusive os PDFs do seed e a pasta de uploads);
4. Quem abriu o PR sabe explicar o que o código faz (vale principalmente para código gerado por IA).

Testes são feitos **junto** com a funcionalidade, não depois. E nada do que já funcionava no M5 pode quebrar: Home, Indicadores, dashboard, filtros e login continuam iguais, e nenhuma rota pública passa a mostrar rascunho.

## Como ler as dependências

Em cada arquivo individual, toda tarefa tem uma etiqueta:

- **[livre]**: pode começar já, não espera ninguém.
- **[depende de: Fulano, o quê]**: só dá para fazer ou terminar depois que Fulano entregar aquilo. Enquanto isso, adiante com dado falso (mock) ou pegue outra tarefa.
- **[bloqueia: Fulano]**: tem gente esperando por isso. Prioridade máxima, e avise no grupo quando mergear.

No quadro, a dependência também está marcada na própria issue (o ícone vermelho de bloqueada).

## Mapa de dependências

| Quem entrega | O quê | Até | Quem está esperando |
|---|---|---|---|
| Christian | Milestone 6 no GitHub, issues e quadro; reunião de início | Sáb 17/10 | **Todos** |
| Christian e Giovana | Contrato do M6 fechado em `docs/contrato-api.md` | Seg 19/10 | **Todos** |
| Christian | Perfil no usuário (migração) e editor de desenvolvimento no seed | Ter 20/10 | Karolina, Maria Clara |
| Giovana | PDFs ilustrativos e relatórios no seed | Ter 20/10 | Samuel, Christian |
| Karolina | `AdminLayout` e `StatusBadge` | Ter 20/10 | Maria Clara |
| Maria Clara | `services/admin.js` com os mocks do painel | Ter 20/10 | Karolina |
| Samuel | `services/api.js` com relatórios e mocks | Ter 20/10 | Samuel (Tela 4) |
| Giovana | Rotas de cadastro e edição (E12) | Qua 21/10 | Maria Clara (Tela 7) |
| Maria Clara | `GET /api/admin/indicadores` com status (E11) | Qua 21/10 | Maria Clara (Tela 6), Karolina |
| Christian | `exigirPerfil` e rotas de status (E13) | Qui 22/10 | Karolina (botões) |
| Christian | `GET /api/relatorios` público com filtros (E15) | Sex 23/10 | Samuel |
| Giovana | Upload de PDF (E14) | Sex 23/10 | Maria Clara (Tela 8) |
| Maria Clara | Tela 6 (painel de gestão) | Sex 23/10 | Karolina (publicar medições) |
| Giovana | Download do PDF (E16) | Sáb 24/10 | Samuel (botão Baixar) |
| Maria Clara | Tela 8 (upload) | Seg 26/10 | Karolina (publicar relatórios) |
| Todos | Tudo mergeado | Qua 28/10 | Maria Clara (teste em máquina limpa) |
| Todos | Gravação da própria parte do vídeo | Qui 29/10, 12h | Christian (edição) |
| Christian | Vídeo editado e link no relatório | Qui 29/10, noite | Entrega |

O caminho crítico é: **contrato → perfil e rotas do painel → Telas 6, 7 e 8 → publicar/despublicar → integração**. Do lado público: **contrato → PDFs no seed → rota pública e download → Tela 4**. Se qualquer um desses atrasar, avise cedo.

## Calendário

| Dia | O que precisa acontecer |
|---|---|
| Sáb 17/10 | Reunião curta de início (online, 30 min). Milestone 6, issues e quadro já estão no GitHub. |
| Dom 18 e Seg 19/10 | Christian e Giovana fecham o contrato do M6; Maria Clara revisa a parte do painel. Todo mundo começa o que é **[livre]**. |
| Ter 20/10 | Perfil no banco (Christian), PDFs e seed (Giovana), `AdminLayout` e `StatusBadge` (Karolina), mocks do painel (Maria Clara) e dos relatórios (Samuel). |
| Qua 21 a Sex 23/10 | Rotas de cadastro (E12) e listagem (E11), status e perfis (E13), upload (E14), rota pública (E15). Telas 6 e 4 com mock onde a API ainda não chegou. |
| Sáb 24 a Seg 26/10 | Download (E16), Telas 7 e 8, botões de publicar, filtros da página de relatórios, identidade visual e responsividade. |
| Ter 27/10 | **Integração:** painel e relatórios com a API real, com os dois perfis. |
| Qua 28/10 | **Congelamento:** tudo mergeado, `develop → main`. Maria Clara clona do zero e segue o README numa máquina limpa. |
| Qui 29/10 | Gravação até 12h. Christian edita à tarde, sobe e fecha o relatório. |
| Sex 30/10 | Entrega. |

Não tem feriado no meio desta vez, mas são só duas semanas. Travou? Avise no grupo no mesmo dia, não na véspera. Quem terminar antes ajuda quem está atolado.

## Git (o mesmo do M4 e do M5)

O detalhe está em `docs/fluxo-de-trabalho.md`, no repositório. Resumo:

- `develop` é a branch padrão; toda branch de tarefa sai dela e o PR volta para ela. `main` só recebe versão validada, por PR `develop → main`.
- Uma branch por tarefa, no padrão `tipo/Entrega-issue-descricao`: `feat/E13-<issue>-perfis`, `feat/E14-<issue>-upload-pdf`, `feat/E15-<issue>-pagina-relatorios`...
- CI roda em todo PR (backend com Postgres; frontend com lint, Vitest e build; compose de ponta a ponta). PR com CI vermelho não é revisado.
- PR pequeno é revisado rápido. Na descrição: o que faz, como testar e `Closes #N`. PR de tela leva print (como no M5, em `docs/pr-N`).
- Migração nova é **uma por PR** e com nome claro (`npx prisma migrate dev --name perfil_usuario`). Duas pessoas mexendo no `schema.prisma` ao mesmo tempo dá conflito: a única migração prevista no M6 é a do perfil (Christian).

## PDFs dos relatórios (dados ilustrativos)

A SMCELT ainda não mandou os relatórios oficiais (o Relatório OT nº 004/2025 não está com o grupo). Para a página pública não abrir vazia:

- A Giovana gera **um ou dois PDFs ilustrativos** a partir dos dados que já estão na carga (por exemplo, "Boletim ilustrativo de indicadores 2025/2" com hospedagem e turismo, e "Participação econômica por setor 2025/2"). Na capa e no rodapé de cada página vai escrito: **"Documento ilustrativo gerado pelo grupo a partir dos mockups do Milestone III. Aguarda os relatórios oficiais da SMCELT."**
- **Não inventar número**, como no M4 e no M5: o PDF só mostra valores que já estão na carga.
- Os PDFs ficam em `backend/prisma/dados/relatorios/`, junto com um `relatorios.json` (título, edição, categoria, data, descrição, arquivo e `"fonte"`). O seed copia os arquivos para a pasta de uploads e cria as linhas da tabela `relatorio` como **publicadas**, sem duplicar quando roda de novo.
- Categorias (as do mockup da Tela 8): **Perfil de Demanda, Setor Hoteleiro, Impacto Econômico, Diagnóstico Estratégico**.
- No vídeo, além dos PDFs do seed, a Maria Clara faz um upload ao vivo.

Depois do seed: os mesmos 6 setores, 12 indicadores e 23 medições do M5, mais 2 usuários de desenvolvimento ativos (administrador e editor) e os relatórios ilustrativos publicados.

## Contrato da API (o que muda; fecha em `docs/contrato-api.md` até seg 19/10)

Se algo abaixo mudar na revisão do contrato, vale o que estiver no `docs/contrato-api.md`. Tudo que não está aqui continua como no M5.

### Perfil

- Migração: `usuario.perfil VARCHAR(20) NOT NULL DEFAULT 'administrador'`, com os valores `administrador` e `editor`.
- `POST /api/auth/login` e `GET /api/auth/me` passam a devolver `perfil` dentro de `usuario`.
- O seed cria o administrador (`ADMIN_EMAIL`/`ADMIN_SENHA`, como no M5) e um editor (`EDITOR_EMAIL`/`EDITOR_SENHA`). As variáveis novas vão no `.env.example`, no `docker-compose.yml` **e no `ci.yml`**, sempre com valores de desenvolvimento.

### Painel (todas exigem `Authorization: Bearer <token>`; sem token ou com token inválido → `401`)

```
GET    /api/admin/indicadores?setor=1&status=rascunho     (E11)
POST   /api/admin/indicadores                              (E12)
PUT    /api/admin/indicadores/:id                          (E12)
POST   /api/admin/medicoes                                 (E12)
PUT    /api/admin/medicoes/:id                             (E12)
PATCH  /api/admin/medicoes/:id/status   { "status": "publicado" }   (E13, só administrador)
GET    /api/admin/relatorios                               (E14)
POST   /api/admin/relatorios            multipart/form-data (E14)
PATCH  /api/admin/relatorios/:id/status { "status": "rascunho" }    (E13, só administrador)
```

- `GET /api/admin/indicadores`: todos os indicadores, cada um com **todas** as medições (rascunho e publicadas), e cada medição com `id`, `ano`, `semestre`, `valor` e `status`. Filtros opcionais `setor` e `status` (`rascunho` ou `publicado`); fora disso, `400`.
- `POST /api/admin/indicadores`: `{ id_setor, nome, descricao, unidade }` → `201`. Setor inexistente ou campo obrigatório faltando → `400`.
- `POST /api/admin/medicoes`: `{ id_indicador, ano, semestre, valor }` → `201`, com `status: "rascunho"` e `id_usuario` igual a quem está logado. Se o período ainda não existe, ele é criado. **Já existe medição desse indicador nesse ano e semestre → `409`** com `{ "erro": "Já existe uma medição deste indicador em 2025/2" }` (o banco já tem `@@unique([id_indicador, id_periodo])`; a rota transforma o erro do Prisma em `409`, não em `500`).
- `PUT /api/admin/medicoes/:id`: muda `valor` (e, se vier, ano e semestre, de novo com a regra do `409`). Medição publicada → `409` com "Despublique a medição antes de editar".
- `PATCH .../status`: só `administrador`; editor → `403` com `{ "erro": "Seu perfil não pode publicar conteúdo" }`. Status fora de `rascunho`/`publicado` → `400`. Id inexistente → `404`.
- `POST /api/admin/relatorios`: campos `titulo`, `edicao`, `categoria`, `data_publicacao`, `descricao` (até 500 caracteres) e o arquivo no campo `arquivo`. Só PDF (tipo `application/pdf` **e** o arquivo começa com `%PDF`) → senão `400`. Até 10 MB → senão `413`. Nasce `rascunho`. Resposta `201` com o relatório (sem o caminho interno do arquivo).

### Públicas

```
GET /api/relatorios?ano=2025&categoria=Setor%20Hoteleiro     (E15)
GET /api/relatorios/:id/arquivo                              (E16)
```

- `GET /api/relatorios`: só os **publicados**, do mais recente para o mais antigo, com `id`, `titulo`, `edicao`, `categoria`, `data_publicacao`, `descricao` e `tamanho_kb`. `ano` filtra pelo ano da `data_publicacao` (mesma validação de 4 dígitos do M5); categoria fora da lista → `400`. Filtro válido sem resultado → `200` com `[]`.
- `GET /api/relatorios/:id/arquivo`: devolve o PDF com `Content-Type: application/pdf` e `Content-Disposition: attachment; filename="<edição>-<título>.pdf"`. Relatório em rascunho, inexistente ou com o arquivo sumido → `404` (não revela que existe um rascunho).

### Onde ficam os arquivos

- Volume Docker `uploads`, montado em `/app/uploads` no backend (o mesmo jeito do `postgres_data`). Nome do arquivo gerado pelo servidor (nunca o nome que veio do navegador).
- `arquivo_url` guarda só o caminho relativo dentro de `uploads/`. Ninguém acessa a pasta direto: o download passa pela rota, que confere o status.
- Biblioteca de upload: `multer`, com limite de tamanho configurado nele.

## Identidade visual

A mesma do M4 e do M5 (`Proposta_Prefeitura_SRS_Inatel.pdf`, páginas 6 e 7): gradiente `#0A4AAD → #6C5CE0 → #C750D6` só nos destaques, fundo claro no resto, e a paleta dos gráficos `#5FE6E0`, `#6C5CE0`, `#27B7FD`, `#B986ED`, `#F3B8F7`, `#FADA77`. Tudo já está em `frontend/src/theme/`. Novidade do M6: o painel administrativo segue a mesma identidade, e a Karolina faz uma passada final em todas as telas.

## Vídeo (cerca de 5 min, todos falam)

Cada um grava a própria parte com a tela compartilhada. **De novo quem edita é o Christian.** O roteiro com as falas sai na semana da entrega, como no M5 (`06_Roteiro_*.md`).

| Tempo | Quem | O que mostra |
|---|---|---|
| 0:00 a 1:00 | Christian | O que é o M6 (85%), o quadro, os dois perfis (o editor recebendo `403` ao publicar) e o CI verde |
| 1:00 a 2:00 | Giovana | Os PDFs ilustrativos e o `relatorios.json`, a tabela `relatorio` no Adminer, a medição duplicada dando `409` e o upload recusando um arquivo que não é PDF |
| 2:00 a 3:00 | Maria Clara | O painel: listagem com status, cadastro de uma medição nova, a tentativa de duplicada e o upload de um PDF |
| 3:00 a 4:00 | Karolina | Publicar a medição e vê-la aparecer no dashboard público; despublicar; entrar como editor e não ter o botão; o painel com a identidade visual |
| 4:00 a 5:00 | Samuel | A página pública de relatórios, o filtro por ano e categoria, o download e o modo celular. Fechamento: o que vem no M7 |

## Uso de IA (as mesmas regras do M4 e do M5)

- Dê contexto: cole o trecho do contrato, do `schema.prisma` ou o HTML do mockup do Stitch. Sem contexto, a IA inventa.
- Peça sempre os testes junto com o código.
- Nunca cole senha, token, chave de API ou `.env` na IA.
- Leia e rode antes de abrir o PR. "A IA fez" não é resposta se o professor perguntar.
- Upload é a parte mais sensível do M6: confira se a IA não aceitou qualquer tipo de arquivo, não usou o nome que veio do navegador para salvar e não deixou a pasta `uploads` acessível sem passar pela rota.
- O uso de IA é contado no vídeo (cada um, na sua parte), não no PR nem nos commits.

## Olhando adiante (Milestone 7, sexta 13/11)

Testes: plano de testes e testes de ponta a ponta dos fluxos principais (E19), cada um testando a parte de outro, nunca a própria. O Christian organiza a lista de bugs e distribui as correções. A revisão de responsividade e acessibilidade (E18) começa a ser fechada, e entram as dívidas anotadas (limite de tentativas de login, cadastro de usuários pelo painel).
