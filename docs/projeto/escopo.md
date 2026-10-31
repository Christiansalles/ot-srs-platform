# Escopo do projeto

Resumo do documento de especificações *Plataforma Web do Observatório do Turismo de Santa Rita do Sapucaí* (Edital HEIComp 2026.2, SMCELT, agosto de 2026). O PDF original fica com o grupo, fora do repositório, porque traz o contato técnico da Secretaria. Ele é a **única referência de requisitos** do projeto: quando um mockup, uma issue ou uma ideia nova não bater com o que está aqui, vale este documento.

## Contexto

O Observatório do Turismo de Santa Rita do Sapucaí (OT-SRS) coleta dados turísticos e econômicos periodicamente: hospedagem, leitos, empresas, empregos e fluxo de visitantes. Também produz relatórios de pesquisa sobre o perfil dos turistas. Hoje a coleta é manual e anual, com pouco retorno dos estabelecimentos, e o conteúdo fica em arquivos internos, sem acesso público.

## Objetivo do protótipo

Organizar o acesso à informação turística do OT-SRS, para que gestores públicos, empreendedores, pesquisadores e a população consultem indicadores e relatórios, com atualização contínua pela Secretaria. O resultado esperado é um protótipo funcional, construído ao longo do semestre, que a SMCELT possa avaliar e evoluir. Ele deve:

- preservar o histórico de dados entre mudanças de gestão;
- dar aos empreendedores uma base concreta para planejar;
- tornar visível à comunidade o impacto real do turismo local.

## Funcionalidades essenciais (itens 1 a 5)

| # | Funcionalidade | O que a Proposta pede | Onde está no projeto |
|---|---|---|---|
| 1 | Indicadores turísticos | Publicação organizada de hospedagem, leitos, empresas e empregos do setor | `/indicadores` (Tela 3), `GET /api/indicadores` |
| 2 | Relatórios públicos | Acesso público aos relatórios e pesquisas em PDF, para download | `/relatorios` (Tela 4), `GET /api/relatorios` e `/api/relatorios/:id/arquivo` |
| 3 | Dashboard visual | Gráficos e cards de leitura rápida para qualquer público | `/dashboard` (Tela 2) e destaques na Home (Tela 1) |
| 4 | Filtros por período e setor | Consulta por intervalo de tempo e por setor da economia turística | `FiltrosPainel`, parâmetros `ano`, `semestre` e `setor` |
| 5 | Painel administrativo | "Área simples para que a equipe da SMCELT atualize e publique novos dados" | `/admin` (Telas 5 a 8), rotas `/api/admin/*` |

## Funcionalidades desejáveis (fase 2, itens 6 a 8)

Entram só se o cronograma permitir, depois do escopo essencial.

| # | Funcionalidade | O que a Proposta pede |
|---|---|---|
| 6 | Coleta autônoma por estabelecimentos | Formulário para hotéis e pousadas enviarem os próprios dados de ocupação, com validação da SMCELT antes da publicação |
| 7 | Painel informativo Cadastur e FNRH Digital | Seção institucional com orientações de cadastro e links oficiais, sem integração com os sistemas federais |
| 8 | Inventário Turístico (PIT) | Cadastro de atrativos, equipamentos e serviços turísticos, com data da última atualização e lembrete de revisão |

## Público-alvo

| Público | Para quê |
|---|---|
| Gestores públicos (Prefeitura e SMCELT) | Decisões baseadas em dados e continuidade entre mandatos |
| Empreendedores (hotéis, pousadas, comércio e serviços) | Planejar estratégias com dados reais do setor |
| Pesquisadores (estudantes e instituições de ensino) | Acesso a séries históricas de indicadores |
| População em geral | Ver o impacto real do turismo na economia do município |

Identidade visual e logotipos: ver [identidade-visual.md](identidade-visual.md). Decisões tomadas a partir deste escopo: ver [decisoes.md](decisoes.md).
