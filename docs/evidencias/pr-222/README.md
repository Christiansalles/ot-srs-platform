# Evidências do PR #222: upload de relatórios no painel

As capturas foram feitas na branch do PR, já com a `develop` atual mesclada (Telas 6 e 7 do #220 e do #221). O teste foi contra a API real, com Postgres e o seed, numa sessão do perfil editor, no Chrome, em 375 e 1280 px. Os dois envios bem-sucedidos usam uma cópia do PDF ilustrativo `OT-ILUS-01/2025` do seed, com o título "Relatório de teste do upload". Nenhuma página rola na horizontal. O único erro no console é o `400` do PDF falso, que é esperado.

| Arquivo | O que mostra |
|---|---|
| `relatorios-inicial-375.png`, `relatorios-inicial-1280.png` | `/admin/relatorios` com a área de arrastar ou selecionar, os campos, o contador de 500 caracteres e a lista com os dois relatórios publicados do seed |
| `relatorios-erro-tamanho-375.png`, `relatorios-erro-tamanho-1280.png` | Arquivo de 11 MiB recusado no front ("O arquivo excede o limite de 10 MiB."), sem chamar a API |
| `relatorios-erro-api-375.png`, `relatorios-erro-api-1280.png` | Arquivo `.pdf` cujo conteúdo não é PDF: passa no front, a API responde `400` "Arquivo PDF obrigatório" e os campos continuam preenchidos |
| `relatorios-preenchido-375.png`, `relatorios-preenchido-1280.png` | PDF válido selecionado (nome e tamanho, com "Remover arquivo") e todos os campos preenchidos |
| `relatorios-enviado-375.png`, `relatorios-enviado-1280.png` | Depois do `201`: mensagem de sucesso, formulário limpo e o relatório novo no topo da lista como rascunho |

Também conferido: um `.txt` é recusado no front ("Selecione um arquivo PDF válido."), o formulário vazio não chega a chamar a API e os relatórios enviados não aparecem em `/api/relatorios`, a rota pública.
