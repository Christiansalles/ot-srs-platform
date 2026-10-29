# Decisões do projeto

Decisões que o grupo já tomou e que não estão óbvias no código. Antes de propor algo que contradiga uma delas, leia o motivo e converse com o grupo. Cada uma aponta para a visão geral do milestone em que foi tomada ([planejamento](../planejamento/README.md)).

## Dados

**Não inventar número.** A única referência é a Proposta ([escopo](escopo.md)), e ela não traz nenhum valor de indicador. O Relatório OT nº 004/2025 aparece na Proposta só como referência da identidade visual, e o grupo não tem esse documento. Por isso:

- a carga (`backend/prisma/dados/*.json`) usa **valores ilustrativos tirados dos mockups do Stitch**, e cada medição tem um campo `fonte` dizendo de qual tela veio (`"Stitch M3 - Image 12.html"`; a correspondência com os nomes novos está em [referencias/stitch](../referencias/stitch/README.md));
- nunca se deriva um valor de um "+x%" do mockup; se o mockup não mostra o número, ele não entra;
- a carga atual tem 6 setores, 12 indicadores e 23 medições. Teste, mock e documentação usam esses mesmos números;
- quando a SMCELT mandar dados oficiais, eles substituem a carga ilustrativa.

M4 e M5: [m4-visao-geral.md](../planejamento/m4-visao-geral.md), [m5-visao-geral.md](../planejamento/m5-visao-geral.md).

**Relatórios em PDF também são ilustrativos.** Os dois PDFs de `backend/prisma/dados/relatorios/` foram gerados pelo grupo só com números que já estão na carga. A capa e o rodapé avisam que são ilustrativos e que aguardam os relatórios oficiais da SMCELT. As categorias são as do mockup da Tela 8: Perfil de Demanda, Setor Hoteleiro, Impacto Econômico e Diagnóstico Estratégico. M6: [m6-visao-geral.md](../planejamento/m6-visao-geral.md).

## Publicação e perfis

A Proposta pede só uma "área simples para que a equipe da SMCELT atualize e publique novos dados". As telas novas do Stitch mostram um status "Homologado", com o COMTUR aprovando, mas isso não está na Proposta. Decisão do M6:

- **Dois status:** `rascunho` e `publicado`. Não existe "homologado" e o COMTUR não aprova nada.
- **Rotas públicas só mostram `publicado`.** Isso vale desde o M4 e é coberto por testes de regressão. Um rascunho nunca aparece numa rota pública, nem pela contagem nem pelo download (relatório em rascunho dá `404`, sem revelar que existe).
- **Dois perfis**, ambos da equipe da SMCELT, na coluna `usuario.perfil`:
  - `administrador`: cadastra, edita, sobe PDF, publica e despublica;
  - `editor`: cadastra, edita e sobe PDF, tudo como rascunho. Publicar ou despublicar devolve `403`, e no front os botões nem aparecem.
- Tudo nasce em `rascunho`. Medição publicada não se edita direto: primeiro se despublica.
- O seed cria um administrador e um editor de desenvolvimento a partir de `ADMIN_*` e `EDITOR_*`. O cadastro de usuários pelo painel ficou para depois.

## Login

- JWT guardado no `sessionStorage` e enviado como `Authorization: Bearer <token>`.
- A mesma mensagem para e-mail inexistente e senha errada; `senha_hash` nunca sai em resposta.
- Sem "Esqueci minha senha": não se coloca um link que não funciona.
- O limite de tentativas no login é dívida planejada para o M7.

## Escopo

- Os itens 1 a 5 da Proposta são o escopo essencial. A fase 2 (itens 6 a 8) só entra se sobrar tempo. Das três, a página informativa do Cadastur e da FNRH (item 7) é a mais barata.
- As telas de [referencias/stitch/fora-do-escopo](../referencias/stitch/README.md#fora-do-escopo) não devem ser implementadas.
- Também não entram: agenda de eventos, que não está na Proposta, nem coleta autônoma ou inventário antes do escopo essencial estar fechado ([backlog-m7-m8.md](../planejamento/backlog-m7-m8.md)).

## Código e processo

- **Contrato primeiro.** O front programa contra o [contrato da API](../contrato-api.md) e usa mocks no mesmo formato. Mudar rota, campo ou código de erro exige PR no contrato e aviso ao grupo.
- **Uma migração por PR**, com nome claro. Duas pessoas mexendo no `schema.prisma` ao mesmo tempo gera conflito.
- **Mock só quando pedido.** `VITE_USE_MOCK=true` liga os dados ilustrativos do front. Se a API falhar, o front mostra o erro; o mock não entra automaticamente.
- **Uploads** (definidos no contrato): só PDF, conferido pelo tipo e pelos bytes `%PDF`, até 10 MiB, com o nome do arquivo gerado pelo servidor. A pasta `uploads` só é acessível pela rota de download, que confere o status. É a parte mais sensível do painel: revise com atenção o código gerado por IA.
- **Pronto** é: na `main`, com testes no CI, rodando com `docker compose up --build` e com quem abriu o PR sabendo explicar o código ([fluxo de trabalho](../fluxo-de-trabalho.md)).
