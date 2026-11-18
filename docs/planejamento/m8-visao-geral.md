> Cópia do `Milestone8_Tarefas/00_Visao_Geral_M8.md`, mantido fora do repositório pelo grupo. Os arquivos individuais citados aqui não foram copiados; as tarefas de cada pessoa estão nas issues do milestone "Milestone 8" no quadro (#317 a #340, mais a #271).

# Milestone 8: visão geral do grupo

**Entrega:** sexta, 27/11. **Apresentação final:** sexta, 04/12.
**Tema do professor:** Manutenção (*Maintenance*), o último milestone.
**Meta:** 100% do projeto, ou seja, as entregas E1 a E20 prontas. No M8 fecha a **E20** (versão final empacotada, com documentação e manual do painel), prometida desde o relatório do M6.
**Fatia:** deixar o sistema pronto para a SMCELT receber e manter: um manual do painel para quem não é programador, um guia de implantação, os dados conferidos um a um, os ajustes de usabilidade que o celular de verdade mostrar e uma versão `v1.0.0` na `main`. Se sobrar fôlego, dois extras: busca e "Visualizar" na página de relatórios, e a página informativa do Cadastur e da FNRH (item 7 da fase 2 da Proposta).

Cada um tem um arquivo próprio nesta pasta com as suas tarefas. Este aqui vale para todos.

Pelos slides da disciplina, os milestones valem 70% da nota e a apresentação final, 30%. Na apresentação, o professor pode perguntar sobre qualquer parte para qualquer integrante, e quem não souber responder fica sem a nota daquela parte.

---

## O que entra no M8

| Item | O que é | Quem faz | Revisor do PR |
|---|---|---|---|
| Fechar o M7 | Mergear o #316 (cobertura), levar a #271 para o M8 e fechar o milestone 7 | Christian | Giovana (#316) |
| Contrato do M8 | `busca` em `GET /api/relatorios` e `?visualizar=1` no download, em `docs/contrato-api.md` e nos mocks | Christian | Giovana e Samuel |
| CT-39 · celular de verdade | O exploratório do plano de testes que ficou pendente no M7, em dois aparelhos (de preferência um Android e um iPhone) | Giovana e Samuel | (cada achado vira bug) |
| Revisão dos dados publicados | Conferir cada valor da carga com a `fonte` e com o que as telas e os PDFs mostram | Giovana | Christian |
| Ajustes de usabilidade | Correção dos achados do CT-39 e da revisão dos dados, cada um com teste | Quem fez a parte (triagem do Christian) | Quem a triagem indicar |
| E20 · manual do painel | `docs/manual-do-painel.md` com prints, para a equipe da SMCELT, e uma versão em PDF | Maria Clara | Giovana (testa seguindo só o manual) |
| E20 · guia de implantação | `docs/implantacao.md`: subir num servidor, trocar as senhas de desenvolvimento, criar o primeiro administrador, backup do banco e dos PDFs | Christian | Maria Clara (testa seguindo só o guia) |
| E20 · dados da carga | `docs/dados-da-carga.md`: como a carga está organizada e como trocar os valores ilustrativos pelos oficiais | Giovana | Christian |
| E20 · versão final | README final, `develop → main`, tag `v1.0.0` e *release* no GitHub; teste em máquina limpa (#271) | Christian e Samuel | Samuel / todos |
| Extra · busca e Visualizar | API (Giovana), Tela 4 (Samuel) e E2E (Karolina) | Giovana, Samuel e Karolina | Christian (back) / Maria Clara (front) / Samuel (E2E) |
| Extra · Cadastur e FNRH | Página informativa (Karolina) e E2E com axe (Samuel) | Karolina e Samuel | Samuel / Karolina |
| Vídeo, relatório e apresentação | Roteiro, edição, relatório do M8, slides e dois ensaios | Christian e todos | Todos |

**Regra do rodízio (a mesma do M7):** ninguém escreve o teste de ponta a ponta da própria parte, e nenhum documento é aprovado por quem o escreveu. Quem testa o manual não é quem o escreveu; quem testa o guia também não.

## Decisões deste milestone

### Busca e "Visualizar" na página de relatórios

A Tela 4 do Stitch já tem o campo "Buscar relatórios por título, palavra-chave ou código" e um botão de visualizar, que ficaram de fora no M6. Dois dos três grupos que comparamos no M6 têm busca. Entra assim:

- **Busca no servidor**, pelo parâmetro `busca`, combinável com `ano` e `categoria`, como os filtros que já existem, e guardada no endereço da página.
- Procura no **título e na edição**, sem diferenciar maiúsculas, minúsculas e acentos ("relatorio" acha "Relatório"). A lista é pequena, então pode filtrar no JavaScript depois de ler os publicados; não precisa de extensão no Postgres nem de migração.
- **"Visualizar"** abre o PDF numa aba nova, pela mesma rota de download com `?visualizar=1`, que troca o `attachment` por `inline`. As regras do `404` (rascunho, inexistente, arquivo sumido) não mudam. "Baixar PDF" continua.

### Página informativa do Cadastur e da FNRH Digital (item 7 da fase 2)

A Proposta põe o item 7 como desejável, "sem depender de integração direta com os sistemas federais". É a funcionalidade de fase 2 mais barata e nenhum dos outros grupos fez. Entra **só se estiver mergeada até terça, 24/11**; senão, a issue fecha como "não planejada" e o relatório explica por quê.

- Página estática, sem back-end, sem formulário e sem integração: o que é o Cadastur, quem deve se cadastrar, o que é a FNRH Digital e os links oficiais.
- **Não inventar regra.** Cada frase sobre obrigação, prazo ou passo de cadastro vem de uma página oficial do governo, com o link ao lado. Na dúvida, a frase sai e fica só o link.
- Rota `/cadastur-e-fnrh`, com link no rodapé e um bloco curto na Home. Não entra no menu principal, para não mexer no menu do celular que o M7 acertou.
- Sem mockup no Stitch: segue o padrão das páginas públicas e a [identidade visual](../projeto/identidade-visual.md).

### Manual do painel e guia de implantação

- **Manual** para a equipe da SMCELT, sem jargão: entrar, ler o painel, cadastrar e editar medição, a duplicada, publicar e despublicar, subir e publicar PDF, usuários e perfis, e as mensagens de erro mais comuns (senha errada, bloqueio por tentativas, editor sem permissão). Cada passo com print. Fica em `docs/manual-do-painel.md`, com as imagens em `docs/manual/`, e sai também em PDF para o relatório e para a SMCELT.
- **Guia de implantação** para quem vai instalar: `docker compose` num servidor, o que trocar no `.env` antes de ligar (`JWT_SECRET`, `ADMIN_EMAIL` e `ADMIN_SENHA` reais, sem editor de desenvolvimento), como o seed cria o primeiro administrador, backup do volume do Postgres e da pasta de PDFs, e como atualizar para uma versão nova.
- O README continua sendo o documento de quem programa; ele passa a apontar para o manual, o guia e o contrato.

### Sem migração no M8

Nada no M8 precisa mudar o banco. Se a revisão dos dados achar um valor errado, a correção é no `backend/prisma/dados/*.json` (o seed é repetível), com teste.

## Regra de "pronto" (a mesma do M4 ao M7)

Uma entrega só conta como implementada quando:

1. O código está na `main`: o PR foi revisado por outra pessoa, mergeado na `develop`, e a `develop` foi levada para a `main` numa versão validada;
2. Os testes automatizados existem e passam no CI, inclusive os de ponta a ponta;
3. Roda com `docker compose up --build`, sem passo manual escondido;
4. Quem abriu o PR sabe explicar o que o código faz.

No M8, a E20 também precisa que o manual e o guia tenham sido seguidos por outra pessoa, do começo ao fim, sem ajuda de quem escreveu. E nada do que funcionava no M7 pode quebrar: os 114 testes de ponta a ponta continuam verdes.

## Como reportar um bug

O mesmo do M7: modelo **Bug**, rótulo `bug`, milestone "Milestone 8", sem responsável, e o caso do plano de testes (`CT-39` para o celular). O Christian faz a triagem no domingo, 22/11 (e antes, se for grave). A correção vem com um teste que falhava antes dela.

## Como ler as dependências

As mesmas etiquetas: **[livre]** começa já, **[depende de: Fulano, o quê]** espera alguém (adiante com mock ou outra tarefa), **[bloqueia: Fulano]** tem gente esperando. No quadro, a dependência também está marcada na issue.

## Mapa de dependências

| Quem entrega | O quê | Até | Quem está esperando |
|---|---|---|---|
| Christian | Milestone 8 no GitHub, issues e quadro | Qua 18/11 | **Todos** |
| Christian | Contrato do M8 (busca e Visualizar) | Qui 19/11 | Giovana (API), Samuel (tela) |
| Giovana e Samuel | CT-39 nos dois celulares, com os bugs abertos | Sáb 21/11 | Christian (triagem) |
| Giovana | Revisão dos dados, com os bugs abertos | Sáb 21/11 | Christian (triagem) |
| Giovana | API de busca e Visualizar | Sáb 21/11 | Samuel (Tela 4) |
| Christian | Triagem e distribuição | Dom 22/11 | **Todos** (correções) |
| Maria Clara | Manual do painel (PR) | Seg 23/11 | Giovana (teste do manual), Christian (README) |
| Christian | Guia de implantação (PR) | Seg 23/11 | Maria Clara (teste do guia) |
| Samuel | Busca e Visualizar na Tela 4 | Seg 23/11 | Karolina (E2E) |
| Karolina | Página Cadastur e FNRH | Seg 23/11 | Samuel (E2E) |
| Todos | Correções, testes do manual e do guia, E2E dos extras | Ter 24/11 | Christian (integração) |
| Christian | `develop → main`, tag `v1.0.0` e *release* | Qua 25/11 | Samuel (máquina limpa), gravações |
| Todos | Gravação da própria parte do vídeo | Qui 26/11, 12h | Christian (edição) |
| Christian e todos | Slides da apresentação | Seg 30/11 | Ensaios |

O caminho crítico é: **CT-39 e revisão dos dados → triagem → correções → integração → `main` com `v1.0.0`**. A E20 corre em paralelo e não depende dos extras. Se algo atrasar, os extras saem primeiro: nunca a E20.

## Calendário

| Dia | O que precisa acontecer |
|---|---|
| Qua 18/11 | Milestone 8, issues e quadro no GitHub. |
| Qui 19/11 | Reunião curta de início (online, 30 min). Contrato do M8. Fechar o M7 (#316). CT-39 nos dois celulares. |
| Sex 20/11 | Dia da Consciência Negra (feriado). Nada obrigatório; quem puder adianta o que é **[livre]**. |
| Sáb 21/11 | Achados do CT-39 e da revisão dos dados abertos como bug. API de busca e Visualizar. |
| Dom 22/11 | **Triagem:** o Christian distribui as correções. |
| Seg 23/11 | Manual do painel, guia de implantação, busca na Tela 4 e página Cadastur em PR. |
| Ter 24/11 | **Integração:** correções mergeadas, manual e guia testados por outra pessoa, E2E dos extras verde. Último dia para a página Cadastur entrar. |
| Qua 25/11 | **Congelamento:** `develop → main`, tag `v1.0.0` e *release*. Samuel clona do zero e segue o README (#271). |
| Qui 26/11 | Gravação até 12h. Christian edita à tarde, sobe e fecha o relatório. |
| Sex 27/11 | **Entrega do M8.** |
| Seg 30/11 | Slides da apresentação prontos. |
| Ter 01/12 | Ensaio 1, com perguntas cruzadas. |
| Qui 03/12 | Ensaio 2, cronometrado. |
| Sex 04/12 | **Apresentação final.** |

Travou? Avise no grupo no mesmo dia. Quem terminar antes pega bug da lista.

## Git (o mesmo do M4 ao M7)

Detalhe em [fluxo-de-trabalho.md](../fluxo-de-trabalho.md). Branch por tarefa a partir da `develop`, no padrão `tipo/Entrega-issue-descricao`: `docs/E20-<issue>-manual-do-painel`, `feat/E15-<issue>-busca-relatorios`, `feat/fase2-<issue>-cadastur-fnrh`, `fix/E18-<issue>-...`. PR para a `develop`, com o modelo preenchido, `Closes #N` e prints em `docs/evidencias/pr-N/` quando muda tela. **Nenhuma migração no M8.**

## Contrato da API (o que muda; fecha em `docs/contrato-api.md` até qui 19/11)

Se algo abaixo mudar na revisão do contrato, vale o `docs/contrato-api.md`.

### Busca em `GET /api/relatorios`

- Parâmetro opcional `busca`, combinável com `ano` e `categoria`: `GET /api/relatorios?busca=boletim&ano=2026`.
- Procura o texto no `titulo` e na `edicao`, sem diferenciar maiúsculas, minúsculas e acentos. Espaços nas pontas são ignorados; `busca` vazia é o mesmo que sem filtro.
- Mais de 100 caracteres responde `400` com `{ "erro": "Busca inválida" }`.
- Busca válida sem resultado responde `200` com `[]`. Só relatórios publicados, na mesma ordem de hoje.

### Visualizar em `GET /api/relatorios/:id/arquivo`

- Com `?visualizar=1`, a resposta traz `Content-Disposition: inline; filename="<o mesmo nome de hoje>"`. Sem o parâmetro, continua `attachment`.
- As regras do `404` não mudam: rascunho, inexistente e arquivo sumido respondem igual.

Os mocks do front (`relatorios`) ganham o mesmo comportamento da busca.

## Vídeo (cerca de 5 min, todos falam)

Se o modelo do professor no Teams pedir outra coisa, vale o modelo. Cada um grava a própria parte; **de novo quem edita é o Christian**. O roteiro com as falas sai na quarta, 25/11.

| Tempo | Quem | O que mostra |
|---|---|---|
| 0:00 a 1:00 | Christian | O que é o M8 (manutenção, 100%), a *release* `v1.0.0`, o guia de implantação e o quadro com os bugs do CT-39 fechados |
| 1:00 a 2:00 | Maria Clara | O manual do painel: um fluxo inteiro seguido pelo manual, do login à medição publicada |
| 2:00 a 3:00 | Giovana | A revisão dos dados (o que foi conferido e o que mudou), o CT-39 no celular e a API de busca |
| 3:00 a 4:00 | Samuel | Busca e Visualizar na página de relatórios, no celular, e a máquina limpa seguindo só o README |
| 4:00 a 5:00 | Karolina | A página do Cadastur e da FNRH (ou, se ela tiver saído, os ajustes de usabilidade) e o E2E de relatórios. Fechamento do projeto |

## Relatório do M8

Se o professor mandar um modelo novo no Teams, vale o modelo. Se for o mesmo: E20 marcada (20 de 20), o que a manutenção corrigiu (achados do CT-39 e da revisão dos dados), os extras que entraram ou saíram e por quê, os números finais (testes de unidade, de API e de ponta a ponta, cobertura, bugs do semestre), o link do manual, do guia e da *release*, dificuldades e uso de IA.

## Apresentação (sexta, 04/12)

- **Slides** prontos na segunda, 30/11: o problema da SMCELT, a arquitetura (Docker Compose, API, banco, front), uma demonstração ao vivo curta (portal, filtros, PDF, painel publicando) e o que fica para a SMCELT evoluir (dados oficiais e fase 2).
- **Perguntas cruzadas** nos dois ensaios: cada pessoa explica a parte de outra, no mesmo rodízio do E2E do M7 (Maria Clara explica o portal público, Samuel o painel, Karolina os relatórios, Giovana a publicação e os perfis, Christian a arquitetura, o CI e os testes). Quem fez a parte faz as perguntas.
- Plano B da demonstração: o sistema já de pé antes de começar e o vídeo do M8 aberto, caso a rede ou o Docker falhem.

## Uso de IA (as mesmas regras)

- Dê contexto: cole o contrato, a tela e o teste que já existe. Sem contexto, a IA inventa campo, texto e passo que não existem.
- No manual e no guia, a IA tende a descrever botões e telas que não existem. Confira cada passo no sistema rodando e tire o print de verdade.
- Na página do Cadastur, a IA tende a inventar regra e prazo legal. Só entra o que está numa página oficial, com o link.
- Nunca cole senha, token, chave de API ou `.env` na IA.
- O uso de IA é contado no vídeo e no relatório, não no PR nem nos commits.
