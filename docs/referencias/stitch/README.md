# Mockups do Stitch

Exportações em HTML das telas desenhadas no Milestone III, no [projeto do Stitch](https://stitch.withgoogle.com/projects/10242954063342123145). Abra o arquivo no navegador ou cole o trecho que interessa como contexto para a IA. O HTML usa o Tailwind pela CDN e não depende de mais nada.

Os nomes originais (`Image N.html`) continuam citados nas visões gerais dos milestones. A tabela mostra a correspondência.

| Tela | Arquivo | Original | Id no Stitch | Entregas |
|---|---|---|---|---|
| 1 · Página inicial | [tela-1-home.html](tela-1-home.html) | `Image 10.html` (igual ao `Image 13.html`) | `9d981381c2f24f1a946b8d76509be510` | E4, E6, E9 |
| 2 · Dashboard | [tela-2-dashboard.html](tela-2-dashboard.html) | `Image 12.html` | `c15072d33cab477f9e07ab2f9a4622a9` | E5, E6, E7, E9 |
| 3 · Indicadores turísticos | [tela-3-indicadores.html](tela-3-indicadores.html) | `Image 6.html` | `79d21d51db2345819278ce03692cd5c8` | E4, E9 |
| 4 · Relatórios (público) | [tela-4-relatorios.html](tela-4-relatorios.html) | `Image 2.html` | `3a2ad5c1ffb845198df3d05b7a3a6719` | E15, E16 |
| 5 · Login administrativo | [tela-5-login.html](tela-5-login.html) | `Image 15.html` | | E10 |
| 6 · Painel de gestão | [tela-6-painel-gestao.html](tela-6-painel-gestao.html) | `Image 8.html` | | E11, E13 |
| 7 · Cadastrar indicador | [tela-7-cadastrar-indicador.html](tela-7-cadastrar-indicador.html) | `NovasTelas/Image 2 (1).html` | | E12 |
| 8 · Publicador de relatórios | [tela-8-publicador-relatorios.html](tela-8-publicador-relatorios.html) | `NovasTelas/Image 2.html` | | E13, E14 |

O cabeçalho com o botão "Acesso Administrativo" é a tela `40dcbf6d24284f80b700ff2638ca6e05` no Stitch.

## Sistema de design

[design-system.md](design-system.md) é o arquivo de design do projeto no Stitch (`Image 17.markdown`): cores, tipografia (Plus Jakarta Sans), espaçamento, sombras e regras de componentes (botões, cards de KPI, tabelas, filtros, badges). As cores usadas de verdade estão em `frontend/src/theme/`. Se as duas fontes divergirem, vale o tema do código e a [identidade visual](../../projeto/identidade-visual.md).

## Fora do escopo

[fora-do-escopo/](fora-do-escopo/) guarda telas que o Stitch gerou, mas que a Proposta não pede. Elas servem só para consulta e **não devem ser implementadas**:

| Arquivo | Original | Por que fica de fora |
|---|---|---|
| `pesquisas-de-demanda.html` | `NovasTelas/Image 2 (2).html` | Pesquisa de origem e motivação dos visitantes: não está entre as funcionalidades da Proposta |
| `ocupacao-hoteleira-mensal.html` | `NovasTelas/Image 2 (3).html` | Apuração mensal por estabelecimento: é a coleta autônoma da fase 2 |
| `configuracoes-ciclo-de-coleta.html` | `NovasTelas/Image 2 (4).html` | Ciclo de coleta e metadados: também é da fase 2 |
| `cadastro-usuarios-comtur.html` | `NovasTelas/Image 4.html` | Cadastro de usuários do COMTUR: o COMTUR não aprova publicações (ver [decisões](../../projeto/decisoes.md)) |

Os textos, nomes, e-mails e números dos mockups são fictícios, gerados pelo Stitch. A única exceção são os valores que o grupo adotou como dados ilustrativos da carga (ver [decisões](../../projeto/decisoes.md)).
