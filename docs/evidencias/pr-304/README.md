# Evidências do PR #304

Capturas feitas em 13/11/2026 com Chromium (Playwright), em 375 e 1280 px, idioma pt-BR e fuso America/Sao_Paulo. Frontend Vite da branch do PR, com API e PostgreSQL reais em um projeto Docker Compose isolado. Os estados normais usam os valores ilustrativos do seed, sem alteração dos indicadores da carga.

| Arquivos (375 e 1280 px) | Estado conferido |
|---|---|
| `painel-*.png` | Tela 6 com dados, mantendo a base visual do painel |
| `painel-colunas-*.png` | Recorte da tabela após buscar “Empregos no setor” e rolar até “Atualizado em” e “Lançado por” |
| `painel-vazio-*.png` | Listagem administrativa vazia, com resposta `[]` simulada no navegador |
| `painel-erro-*.png` | Erro da listagem administrativa, com HTTP 500 simulado no navegador |
| `dashboard-375.png`, `dashboard-1280.png` | Hospedagem em 2025/2, com a data abaixo do título e os gráficos carregados |
| `dashboard-vazio-*.png` | Consulta real de 2025/1, sem medições publicadas: estado vazio e sem texto de atualização |
| `dashboard-sem-data-*.png` | Falha HTTP 500 simulada apenas em `/api/indicadores/atualizacao`: cards e gráficos permanecem, sem data nem erro geral |
| `dashboard-carregando-*.png` | Requisições de indicadores retidas temporariamente pelo Playwright para registrar o carregamento |
| `dashboard-erro-*.png` | HTTP 500 simulado nas consultas de indicadores para registrar o erro do dashboard |

As simulações acima são restritas às respostas interceptadas pelo navegador. Não alteram o backend nem os dados do banco. Foi conferida a ausência de transbordamento horizontal do documento nas duas larguras; a tabela mantém sua própria rolagem. Nenhum erro JavaScript foi observado durante a captura.
