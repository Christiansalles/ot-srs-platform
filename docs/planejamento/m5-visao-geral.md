> Cópia do `Milestone5_Tarefas/00_Visao_Geral_M5.md`, mantido fora do repositório pelo grupo. Os caminhos `Stitch/Image N.html` correspondem aos arquivos de [`docs/referencias/stitch/`](../referencias/stitch/README.md), e `docs/pr-N` agora é `docs/evidencias/pr-N`. Os arquivos individuais citados aqui não foram copiados.

# Milestone 5: visão geral do grupo

**Entrega:** sexta, 16/10, assíncrona (o professor avalia sem a gente na frente).
**Meta:** 55% do projeto, ou seja, as entregas E1 a E10 e mais a E17 prontas.
**Fatia:** dashboard completo e entrada do painel administrativo: todos os cards e gráficos, filtros por período e por setor (API e telas) e o login.

Cada um tem um arquivo próprio nesta pasta com as suas tarefas. Este aqui vale para todos.

---

## As entregas deste Milestone

| Entrega | O que é | Responsável | Revisor do PR |
|---|---|---|---|
| E6 | Demais cards de resumo do dashboard | Karolina | Samuel |
| E7 | Gráficos de distribuição por setor e comparativo anual | Karolina | Samuel |
| E8 | Consultas filtradas por período e por setor na API | Giovana e Christian | um revisa o do outro |
| E9 | Filtros por período e por setor no dashboard e na página de Indicadores | Samuel | Karolina |
| E10 | Login e autenticação do painel administrativo (Tela 5) | Maria Clara | Christian (back) / Samuel (front) |
| E17 | Dados dos demais setores: empresas, empregos e fluxo de visitantes | Giovana | Christian |

**Por que a E17 entrou agora:** no relatório do M4 ela estava prevista para o M6. Mas o dashboard do M5 (cards, gráfico por setor, filtro por setor) não funciona só com hospedagem, então a carga dos outros setores vem antes. Assim o M5 fecha em 55%, e o M6 continua chegando a 85% com E11 a E16. O Christian explica isso no relatório.

## Regra de "pronto" (a mesma do M4)

Uma entrega só conta como implementada quando:

1. O código está na `main`: o PR da tarefa foi revisado por outra pessoa e mergeado na `develop`, e a `develop` foi levada para a `main` numa versão validada;
2. Os testes automatizados dela existem e passam no CI;
3. Roda com `docker compose up --build`, sem passo manual escondido;
4. Quem abriu o PR sabe explicar o que o código faz (vale principalmente para código gerado por IA).

Testes são feitos **junto** com a funcionalidade, não depois. E nada do que já funcionava no M4 pode quebrar: Home, Indicadores e dashboard sem filtro continuam iguais.

## Como ler as dependências

Em cada arquivo individual, toda tarefa tem uma etiqueta:

- **[livre]**: pode começar já, não espera ninguém.
- **[depende de: Fulano, o quê]**: só dá para fazer ou terminar depois que Fulano entregar aquilo. Enquanto isso, adiante com dado falso (mock) ou pegue outra tarefa.
- **[bloqueia: Fulano]**: tem gente esperando por isso. Prioridade máxima, e avise no grupo quando mergear.

## Mapa de dependências

| Quem entrega | O quê | Até | Quem está esperando |
|---|---|---|---|
| Christian | Milestone 5 no GitHub, issues e quadro; reunião de início | Sáb 03/10 | **Todos** |
| Christian e Giovana | Contrato do E8 e do login fechado em `docs/contrato-api.md` | Seg 05/10 | Samuel, Karolina, Maria Clara |
| Samuel | `services/api.js` com filtros + mocks com a carga nova | Ter 06/10 | Karolina |
| Giovana | Carga dos demais setores (`turismo.json`, `participacao.json`, seed) | Qua 07/10 | **Todos** |
| Giovana | Consultas filtradas em `services/dados.js` | Qui 08/10 | Christian |
| Samuel | Componente de filtros (`FiltrosPainel`) | Qui 08/10 | Karolina |
| Maria Clara | `POST /api/auth/login` mergeado | Sex 09/10 | Maria Clara (front), Samuel (revisão do front) |
| Christian | Rotas com `ano` e `semestre` | Sex 09/10 | Samuel, Karolina (integração de terça) |
| Todos | Tudo mergeado | Qua 14/10 | Giovana (teste em máquina limpa) |
| Todos | Gravação da própria parte do vídeo | Qui 15/10, 12h | Christian (edição) |
| Christian | Vídeo editado e link no relatório | Qui 15/10, noite | Entrega |

O caminho crítico é: **contrato → carga → consultas → rotas → integração**. Se qualquer um desses atrasar, o grupo inteiro atrasa, então quem está nele avisa cedo.

## Calendário

| Dia | O que precisa acontecer |
|---|---|
| Sáb 03/10 | Reunião curta de início (online, 30 min). Christian sobe o Milestone 5 no GitHub, as issues e o quadro. |
| Dom 04 e Seg 05/10 | Christian e Giovana fecham o contrato do E8; Maria Clara acrescenta o login. Todo mundo começa o que é **[livre]**. |
| Ter 06/10 | Samuel: `services/api.js` e mocks. Karolina já pode usar. |
| Qua 07/10 | Giovana: carga dos demais setores na `develop`. |
| Qui 08 e Sex 09/10 | Consultas e rotas com filtro (E8), login no back (E10), filtros (E9), cards (E6). |
| Sáb 10 e Dom 11/10 | Gráficos (E7), tela de login, ajustes. Front segue com mock onde a API ainda não chegou. |
| Seg 12/10 | **Feriado (Nossa Senhora Aparecida).** Não conte com ninguém nesse dia. |
| Ter 13/10 | **Integração:** filtros, cards e gráficos com a API real; login de ponta a ponta. |
| Qua 14/10 | **Congelamento:** tudo mergeado, `develop → main`. Giovana clona do zero e segue o README numa máquina limpa. |
| Qui 15/10 | Gravação até 12h. Christian edita à tarde, sobe e fecha o relatório. |
| Sex 16/10 | Entrega. |

Travou? Avise no grupo no mesmo dia, não na véspera. Quem terminar antes ajuda quem está atolado.

## Git (o mesmo do M4)

O detalhe está em `docs/fluxo-de-trabalho.md`, no repositório. Resumo:

- `develop` é a branch padrão; toda branch de tarefa sai dela e o PR volta para ela. `main` só recebe versão validada, por PR `develop → main`.
- Uma branch por tarefa, no padrão `tipo/Entrega-issue-descricao`: `feat/E17-<issue>-carga-turismo`, `feat/E8-<issue>-filtros-api`, `feat/E10-<issue>-login`...
- CI roda em todo PR (backend com Postgres; frontend com lint, Vitest e build). PR com CI vermelho não é revisado.
- PR pequeno é revisado rápido. Na descrição: o que faz, como testar e `Closes #N`.

## Fonte dos dados do M5 (E17)

Mesma regra do M4: são **dados ilustrativos** dos mockups do Milestone III (pasta `Stitch/`), até a SMCELT mandar os oficiais. Só entram números que aparecem nas telas, cada medição com `"fonte"`. Cada ano vira o 2º semestre, como já fizemos com os leitos.

**Setor "Turismo"** (indicadores gerais, como na Tela 3, `Stitch/Image 6.html`):

| Indicador | Unidade | Período | Valor | Fonte |
|---|---|---|---|---|
| Fluxo de visitantes | visitantes | 2020/2 a 2025/2 | 1.100 · 1.900 · 2.450 · 3.600 · 4.400 · 5.200 | `Image 12.html` (gráfico de linha) |
| Número de empresas | empresas | 2025/2 | 120 | `Image 6.html` |
| Empregos no setor | empregos | 2025/2 | 840 | `Image 6.html` |
| Gasto médio do turista | R$ | 2025/2 | 350 | `Image 6.html` |
| Tempo médio de permanência | dias | 2025/2 | 2,8 | `Image 6.html` |

**Participação econômica por setor** (gráfico de rosca do dashboard, `Image 12.html`), unidade `%`, 2025/2. Cria os setores que ainda não existem:

| Setor | Valor |
|---|---|
| Hospedagem | 28 |
| Alimentação & Bares | 24 |
| Serviços & Eventos | 20 |
| Comércio Turístico | 18 |
| Outros | 10 |

Cuidados:

- **Não derivar número.** Os mockups mostram "+15%", "+10%" etc. para empresas e empregos, mas não mostram o valor anterior. Calcular o 2024 a partir dessas porcentagens é inventar dado. Indicador com uma medição só aparece com "Sem período anterior", que o card já trata.
- **Visitantes:** a API calcula 4.400 → 5.200 = **+18,2%**. O "+8%" do card do mockup é inconsistente com o gráfico do próprio mockup e não vale.
- Hospedagem continua igual ao M4 (leitos 280, 312 e 350; ocupação 68%), agora com a participação de 28%.

Depois da carga, o banco tem 6 setores, 12 indicadores, 19 medições e os períodos de 2020/2 a 2025/2.

## Contrato da API (o que muda; fecha em `docs/contrato-api.md` até seg 05/10)

Se algo abaixo mudar na revisão do contrato, vale o que estiver no `docs/contrato-api.md`. Tudo que não está aqui continua como no M4.

```
GET /api/indicadores?setor=1&ano=2025&semestre=2
GET /api/indicadores/destaques?setor=1&ano=2025&semestre=2
```

- Os três parâmetros são opcionais e combináveis. Sem nenhum, as respostas são exatamente as do M4.
- `/api/indicadores`: devolve só as medições que caem no filtro. Indicador sem medição no filtro sai da lista.
- `/api/indicadores/destaques`: o card mostra o valor **do período escolhido** (com `ano` sem `semestre`, o semestre mais recente daquele ano). Indicador sem medição nesse período sai da lista. A `variacao_percentual` continua comparando com a medição publicada anterior, **mesmo que ela esteja fora do filtro**: com `?ano=2024`, leitos mostra 312 e +11,4% (contra 280 de 2023).
- `ano` precisa ser inteiro de 4 dígitos e `semestre` precisa ser 1 ou 2. Fora disso: `400` com `{ "erro": "..." }`. Período válido sem dado: `200` com `[]`.
- Distribuição por setor e comparativo anual **não** ganham rota nova: o front monta a partir de `/api/indicadores`.

Login (E10):

```
POST /api/auth/login        { "email": "...", "senha": "..." }
→ 200 { "token": "...", "usuario": { "id": 2, "nome": "...", "email": "..." } }
→ 401 { "erro": "E-mail ou senha inválidos" }

GET /api/auth/me            Authorization: Bearer <token>
→ 200 { "id": 2, "nome": "...", "email": "..." }
→ 401 { "erro": "..." }
```

- A mesma mensagem para e-mail inexistente e senha errada (não revela quais e-mails existem). Usuário inativo também recebe 401.
- `senha_hash` nunca aparece em resposta nenhuma.
- **Sem perfis no M5:** todo usuário ativo é administrador. Perfis (SMCELT publica, COMTUR homologa) ficam para o M6, junto com a publicação (E13).
- O usuário administrador de desenvolvimento é criado pelo seed a partir de `ADMIN_EMAIL` e `ADMIN_SENHA`. Essas variáveis e o `JWT_SECRET` vão no `.env.example`, no `docker-compose.yml` **e no `ci.yml`** (senão o CI quebra), sempre com valores de desenvolvimento, nunca uma senha real.

## Identidade visual

A mesma do M4 (`Proposta_Prefeitura_SRS_Inatel.pdf`, páginas 6 e 7): gradiente `#0A4AAD → #6C5CE0 → #C750D6` só nos destaques, fundo claro no resto, e a paleta dos gráficos `#5FE6E0`, `#6C5CE0`, `#27B7FD`, `#B986ED`, `#F3B8F7`, `#FADA77`. A rosca do E7 é o primeiro gráfico com 5 cores; use a paleta nessa ordem. Tudo isso já está em `frontend/src/theme/`.

## Vídeo (cerca de 5 min, todos falam)

Cada um grava a própria parte com a tela compartilhada. **Desta vez quem edita é o Christian.** O roteiro com as falas sai na semana da entrega, como no M4 (`06_Roteiro_Video.md`).

| Tempo | Quem | O que mostra |
|---|---|---|
| 0:00 a 1:00 | Christian | O que é o M5 (55%), o quadro, a API com filtros no navegador (incluindo um `400`) e o CI verde |
| 1:00 a 2:00 | Giovana | A nova carga (`turismo.json` e `participacao.json`), os setores no Adminer, a consulta filtrada e os testes |
| 2:00 a 3:00 | Samuel | Os filtros na página de Indicadores e no dashboard, o filtro na URL e o modo celular |
| 3:00 a 4:00 | Karolina | Os cards e os dois gráficos novos, reagindo ao filtro, e os testes |
| 4:00 a 5:00 | Maria Clara | O login: senha errada, entrada no painel, rota protegida, sair. Fechamento: o que vem no M6 |

## Uso de IA (as mesmas regras do M4)

- Dê contexto: cole o trecho do contrato, do schema ou o HTML do mockup do Stitch. Sem contexto, a IA inventa.
- Peça sempre os testes junto com o código.
- Nunca cole senha, token, chave de API ou `.env` na IA.
- Leia e rode antes de abrir o PR. "A IA fez" não é resposta se o professor perguntar.
- O uso de IA é contado no vídeo (cada um, na sua parte), não no PR nem nos commits.

## Olhando adiante (Milestone 6, sexta 30/10)

Relatórios em PDF e painel administrativo completo: listagem com status (E11), cadastro e edição de indicadores e medições (E12), publicação e despublicação com perfis (E13), upload de PDF (E14), página pública de relatórios (E15) e download (E16).
