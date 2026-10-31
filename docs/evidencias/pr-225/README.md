# Evidências do PR #225: download de relatórios

Entrega da #189, conforme a [Tela 4 do Stitch](../../referencias/stitch/tela-4-relatorios.html) e o [contrato](../../contrato-api.md). O card mantém os metadados e acrescenta o link “Baixar PDF”, com nome acessível, indicação de pedido em andamento e mensagem de erro no próprio card.

## Como foi conferido

Edge, `npm run dev`, `VITE_USE_MOCK=false`, viewport de 900 px de altura. As respostas HTTP foram controladas no navegador, usando os metadados e os bytes dos PDFs de `backend/prisma/dados/relatorios/`. Não são capturas com o backend real: o Docker Desktop não disponibilizou o engine local, e a tentativa de subir um Compose isolado foi encerrada.

- Em 320, 375, 768 e 1280 px, a largura total da página correspondeu à viewport. Sem erros de JavaScript.
- Os dois links foram ativados pelo teclado; arquivos baixados comparados byte a byte com os PDFs versionados, com nomes legíveis conforme o contrato.
- Durante o pedido, aparece “Baixando...” e novos pedidos são impedidos. O endereço temporário é liberado após iniciar o download.
- Resposta `404`: “Relatório não encontrado” no card, sem sair da página nem alterar a URL. Uma nova tentativa após o erro permite baixar.
- O download sempre consulta a rota pública, mesmo se a listagem estiver em modo mock. Não há PDF substituto nem fallback automático.

| Documento | Edição | Tamanho conferido |
|---|---|---|
| Indicadores do setor hoteleiro | OT-ILUS-01/2025 | 197.607 bytes (193 KB) |
| Participação econômica do turismo | OT-ILUS-02/2025 | 236.423 bytes (231 KB) |

## Testes

Em `frontend/`: `npm test -- --maxWorkers=2`, `npm run lint` e `npm run build` aprovados. Foram 32 arquivos e 286 testes, incluindo 11 novos para serviço e interface de download. O build mantém o aviso conhecido de bundle acima de 500 kB.

Os testes cobrem URL, nome acessível, KB/MB, arquivo binário, mensagem de `404`, erros de rede/leitura, nome do arquivo salvo, liberação do endereço temporário, nova tentativa e bloqueio de pedidos simultâneos. As verificações de filtros, estados da listagem e padrão visual continuam passando.

## Capturas

| Estado | Celular | Desktop |
|---|---|---|
| Links de download | [375 px](relatorios-375.png) | [1280 px](relatorios-1280.png) |
| Pedido em andamento | [375 px](download-carregando-375.png) | [1280 px](download-carregando-1280.png) |
| Relatório não encontrado | [375 px](download-404-375.png) | [1280 px](download-404-1280.png) |

Também conferidos: [320 px](relatorios-320.png) e [768 px](relatorios-768.png). Os estados de carregamento, erro e vazio da listagem permanecem cobertos nos testes e nas [evidências da página](../pr-203/README.md).
