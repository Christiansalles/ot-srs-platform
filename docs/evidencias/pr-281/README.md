# Evidências do PR #281: auditoria de acessibilidade (#258)

Prints da auditoria registrada na seção "Auditoria de acessibilidade" de [docs/testes/plano-de-testes.md](../../testes/plano-de-testes.md). Foram feitos com `VITE_USE_MOCK=true`, no Chrome, em 390 e 1280 px, na `develop` em `8198b19`. No painel, só a resposta de `/api/auth/me` foi simulada, para entrar como administrador.

As marcações foram desenhadas por script sobre a página. **Vermelho** é um achado e **verde** é algo que passou. Os contrastes nas etiquetas foram medidos pelo axe-core 4.10 ou, sobre foto e gradiente, a partir dos pixels do fundo (o método está no plano de testes).

O prefixo do arquivo diz quem corrige: `a1` a `a3` são os achados A-1 a A-3, que viram bug, e `261` é corrigido na #261. `login-contraste` mostra os dois casos, e `ok` é o que passou.

## Achados

| Arquivo | O que mostra |
|---|---|
| `a1-titulo-da-aba.png` | A-1: o `document.title` lido em cada rota é sempre o mesmo |
| `a2-portal-sem-pular-conteudo-390.png`, `-1280.png` | A-2: a primeira parada do Tab no portal é "Home", sem "Pular para o conteúdo" |
| `a3-indicadores-cabecalho-tabela-390.png`, `-1280.png` | A-3: cabeçalho da tabela de Indicadores a 4,34:1 |
| `login-contraste-390.png`, `-1280.png` | A-4: "SMCELT" a 4,27:1. Para a #261: "Voltar ao portal" (4,4:1) e, no desktop, "Ambiente seguro" e o rodapé da marca (3,3:1) |
| `261-home-variacao-cards-390.png`, `-1280.png` | Variação dos cards da Home a 3,74:1 (o mesmo componente aparece no Dashboard) |
| `261-dashboard-grafico-sem-nome-390.png`, `-1280.png` | O gráfico de evolução recebe Tab como `role="application"`, sem nome acessível |
| `261-dashboard-rosca-aria-hidden-390.png`, `-1280.png` | A rosca da distribuição fica dentro de `aria-hidden` e continua focável |
| `261-painel-sem-pular-conteudo-390.png`, `-1280.png` | No painel, a primeira parada do Tab também não é "Pular para o conteúdo" |
| `261-painel-menu-celular-tab-390.png` | Com o menu do celular aberto, o Tab vai para "Sair" e pula os links do menu, marcados em vermelho |

## O que passou

| Arquivo | O que mostra |
|---|---|
| `ok-home-capa-contraste-390.png`, `-1280.png` | Capa sobre a foto: título a 7:1 e botões a 4,5:1 |
| `ok-indicadores-tabela-foco-390.png`, `-1280.png` | A tabela de Indicadores recebe foco visível e rola com as setas |
| `ok-login-mostrar-senha-390.png`, `-1280.png` | "Mostrar senha" funciona com Enter |
| `ok-tela8-data-foco-390.png`, `-1280.png` | O campo de data da Tela 8 mostra o foco |

## O que ficou sem conferir

- **Leitor de tela:** nenhum print foi feito com NVDA ou TalkBack. O que é anunciado foi conferido pelos papéis no DOM.
- **API real:** as capturas usam o mock. Os achados são de marcação e de CSS, que não mudam com a API.
- **Telas 404 e Usuários:** ainda não existem (#266 e #263).
