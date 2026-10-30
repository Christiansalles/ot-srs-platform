# Evidências do PR #221: cadastro e edição de medições

As capturas foram feitas na branch do PR (`e04677c`, já com o visual alinhado à Tela 6 do #220) contra a API real, com Postgres e o seed. A sessão era do perfil editor, no Chrome, em 375 e 1280 px. Antes das capturas, duas medições de 2026/1 foram criadas em rascunho pela API: Número de leitos (id 24) e Taxa de ocupação (id 25). Nenhuma página rola na horizontal. Os únicos erros no console são esperados: o `409` da tentativa de duplicar e o `500` forçado no estado de erro.

| Arquivo | O que mostra |
|---|---|
| `cadastro-novo-indicador-375.png`, `cadastro-novo-indicador-1280.png` | `/admin/medicoes/nova` com "Cadastrar novo indicador": nome, descrição, setor e unidade, além do aviso de uma medição por indicador e semestre |
| `cadastro-duplicada-409-375.png`, `cadastro-duplicada-409-1280.png` | Número de leitos em 2026/1 de novo: o `409` da API aparece no formulário ("Já existe uma medição deste indicador em 2026/1"), e ano, semestre e valor continuam preenchidos |
| `editar-rascunho-375.png`, `editar-rascunho-1280.png` | `/admin/medicoes/25/editar`: o rascunho carregado com o indicador, o período e o valor (com a unidade na linha do rótulo), e o botão "Salvar alterações" |
| `editar-publicada-375.png`, `editar-publicada-1280.png` | `/admin/medicoes/1/editar`: a medição publicada só para leitura, com "Despublique para editar" e sem botão de salvar |
| `erro-consulta-375.png`, `erro-consulta-1280.png` | Falha ao carregar o formulário, com `/api/setores` respondendo `500` (interceptado no navegador): o estado de erro e o "Tentar novamente" no mesmo formato do painel |
