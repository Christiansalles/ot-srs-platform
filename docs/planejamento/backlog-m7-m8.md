> Cópia do `Backlog_M7_M8.md`, mantido fora do repositório pelo grupo.

# Backlog para o Milestone 7 e o Milestone 8

Levantado em 29/10, no fim do M6, comparando o nosso `develop` (a45aeab) com três repositórios de outros grupos do mesmo projeto:

- `MatheusNetto1/srs-tour` (React + Vite + Tailwind; só parte pública, com testes E2E e visuais)
- `GabrielGuimaraes12/observatorio-turismo-srs` (React + Vite + CSS puro; parte pública com mock e admin simples)
- `Gpatinho/C317` (Next.js + Express + MySQL; admin completo e fase 2 parcial)

**Nada disto vira issue no M6.** Quando o M7 for dividido, cada item entra nas tarefas e no quadro conforme a tabela abaixo.

---

## Já estava no plano (só confirmar que entra)

| Item | Onde já está | Observação da comparação |
|---|---|---|
| Limite de tentativas no login (rate limit) | Dívida do M7 (`Milestone6_Tarefas/00_Visao_Geral_M6.md`, "Olhando adiante") | O `Gpatinho/C317` usa `express-rate-limit` na rota de login, com teste de integração. |
| Testes de ponta a ponta dos fluxos principais | E19, M7 | O `MatheusNetto1/srs-tour` tem E2E e regressão visual com Playwright. Nós já usamos `playwright-core` com o Chrome do sistema nas evidências dos PRs, então dá para aproveitar. |
| Header do celular e tabela de Indicadores no celular | E18, Samuel e Karolina | A #190 foi fechada, mas no `develop` o menu ainda quebra em duas linhas ("Relatórios" sozinho embaixo), o botão "Acesso Administrativo" ocupa uma linha inteira e a tabela de Indicadores corta Unidade, Ano e Valor em 390 px. Os outros dois grupos usam menu hambúrguer. |

## Novo: não estava em lugar nenhum

| # | Item | Por que | Sugestão de milestone | Esforço |
|---|---|---|---|---|
| 1 | **Página 404.** Hoje uma URL inexistente (`/qualquer-coisa`) mostra a tela **toda em branco**, sem header nem rodapé, porque não há rota `*` no `App.jsx`. | Parece bug se a banca digitar uma URL errada. | M7 (entra junto com a E18 ou como bug da lista do M7) | ~15 min |
| 2 | **"Atualizado em" e quem lançou.** A tabela `medicao` guarda `id_usuario`, mas não guarda data de criação nem de alteração. | A Proposta fala em "atualização contínua" e em "preservar o histórico entre mudanças de gestão". O `Gpatinho/C317` mostra "Lançado por" e "Atualizado em" no painel e "Atualizado em 29/out" no dashboard público. | M7 (dívida; a migração é mais segura antes dos testes finais) | Migração `criado_em`/`atualizado_em` + texto no painel e no dashboard |
| 3 | **Busca por título e "Visualizar" o PDF na página de relatórios.** A #188 cobre ano e categoria, e a #189 cobre só o download. | O `MatheusNetto1/srs-tour` e o `Gpatinho/C317` têm busca por título. O `Gpatinho/C317` tem "Baixar PDF" e "Visualizar" (abre no navegador). | M8 (front-end: ajustes de usabilidade) | Pequeno |
| 4 | **Página informativa Cadastur e FNRH Digital** (item 7 da fase 2 da Proposta). | **Nenhum dos três grupos fez.** É a funcionalidade desejável mais barata: página estática com orientação e links oficiais, sem backend. Seria um diferencial. | M8, só se sobrar fôlego (mesma regra da fase 2 no cronograma) | ~1 tarefa de front |

## O que **não** copiar

- **Coleta autônoma por estabelecimentos** (fase 2, item 6) e **inventário turístico** (fase 2, item 8): o `Gpatinho/C317` fez os dois, mas são grandes, e o cronograma diz que a fase 2 só entra se sobrar fôlego depois do M6.
- **Agenda de eventos** (`Gpatinho/C317`): não está na Proposta.
- **"Esqueci minha senha"**: dois grupos têm só o link, sem fluxo por trás. Não vale pôr um link que não funciona.
