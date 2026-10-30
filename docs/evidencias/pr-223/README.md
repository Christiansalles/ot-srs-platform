# Evidências do PR #223: padrão visual comum do painel

As capturas foram feitas na branch do PR (`4a49b3e`), com as Telas 6, 7 e 8 já usando o `AdminCabecalho` e o `AdminPagina.css`. O teste foi contra a API real, com Postgres e o seed, numa sessão do perfil editor, no Chrome, em 375 e 1280 px. Para o selo de rascunho aparecer, uma medição de 2026/1 (Taxa de ocupação, 71) foi criada em rascunho pela API.

Medido no navegador, o título (h1) fica igual nas quatro rotas: 28 px em 375 px e 32 px em 1280 px, com peso 800 e na mesma posição (x = 16 e x = 312). Nenhuma página rola na horizontal. Os únicos erros no console são os `500` forçados nos prints de erro.

| Arquivo | O que mostra |
|---|---|
| `painel-375.png`, `painel-1280.png` | Tela 6 (`/admin`): cabeçalho comum, cartões de resumo e lista |
| `medicao-nova-375.png`, `medicao-nova-1280.png` | Tela 7 (`/admin/medicoes/nova`): o mesmo cabeçalho com "Voltar ao painel", cartões, campos e a barra de ações |
| `medicao-rascunho-375.png`, `medicao-rascunho-1280.png` | Tela 7 editando o rascunho (`/admin/medicoes/24/editar`), com a unidade na linha do rótulo |
| `relatorios-375.png`, `relatorios-1280.png` | Tela 8 (`/admin/relatorios`): o mesmo cabeçalho, cartão do formulário e lista |
| `medicao-erro-375.png`, `medicao-erro-1280.png` | Tela 7 com `/api/setores` respondendo `500` (interceptado no navegador): `admin-estado` em cartão, com "Tentar novamente" |
| `relatorios-erro-375.png`, `relatorios-erro-1280.png` | Tela 8 com a lista respondendo `500`: o mesmo estado de erro dentro do cartão da lista |
