# Evidências do PR #228: integração do painel e dos relatórios com a API real (#155)

Roteiro da #155 executado com a API real, no Docker Compose da `develop` depois do #227 (commit `df3639c`). O front do Compose é construído sem `VITE_USE_MOCK`, então todas as telas consultam a API.

```bash
POSTGRES_PORT=55433 BACKEND_PORT=3001 FRONTEND_PORT=8082 ADMINER_PORT=8083 \
VITE_API_URL=http://localhost:3001 docker compose -p int155 up -d --build
```

As portas foram trocadas só porque as padrão já estavam em uso nesta máquina; com `docker compose up --build` o roteiro é o mesmo em http://localhost:8080. Os usuários são os de teste que já estão como padrão no `docker-compose.yml` (`ADMIN_*` e `EDITOR_*`).

O roteiro foi feito duas vezes: primeiro à mão, no navegador do Claude Desktop, e depois num banco zerado (`down -v`), com um script do Playwright usando o Chrome da máquina, que tirou os prints em 1280 e 375 px. As duas execuções tiveram o mesmo resultado.

**Dados de teste da integração.** A medição e os relatórios abaixo não são dados do Observatório. São valores que já existem na carga, num período de teste (2026/1), só para exercitar o fluxo:

- Gasto médio do turista, 2026/1, R$ 350 (o valor de 2025/2 em `turismo.json`), cadastrada pelo administrador;
- Número de leitos, 2026/1, 350 (o valor de 2025/2 em `hospedagem.json`), cadastrada pelo editor;
- relatórios `TESTE-155` (administrador) e `TESTE-155-ED` (editor), com os PDFs ilustrativos de `backend/prisma/dados/relatorios/`.

## Passo a passo

| Passo | Resultado |
|---|---|
| Admin cadastra Gasto médio 2026/1 = 350 na Tela 7 | `201`, "Medição cadastrada como rascunho."; `GET /api/indicadores?ano=2026` continua `[]` |
| Admin cadastra a mesma medição de novo | `409`, "Já existe uma medição deste indicador em 2026/1" na tela |
| Admin publica na Tela 6 (com confirmação) | `PATCH /api/admin/medicoes/:id/status` `200`; "Publicados no portal" vai de 23 para 24 |
| Dashboard com `?ano=2026&semestre=1` | Card "Gasto médio do turista, 2026/1, R$ 350"; `GET /api/indicadores?ano=2026` traz a medição |
| Admin despublica | `200`, "voltou para rascunho"; `GET /api/indicadores?ano=2026` volta a `[]`, 2026/1 sai de `GET /api/periodos` e do filtro do dashboard |
| Admin sobe `OT-ILUS-01-2025-setor-hoteleiro.pdf` na Tela 8 | `201`, rascunho; não aparece em `GET /api/relatorios` e `GET /api/relatorios/3/arquivo` responde `404` |
| Admin publica o relatório (botão do #227) | `PATCH /api/admin/relatorios/:id/status` `200`; aparece em `/relatorios` ("3 relatórios") |
| Baixar PDF em `/relatorios` | Download interceptado no navegador, sem gravar arquivo: `teste-155-relatorio-de-teste-da-integracao-155.pdf`, 197.607 bytes (o mesmo tamanho do PDF da carga), começando com `%PDF-`; o nome bate com o `Content-Disposition` da API |
| Admin despublica o relatório | `200`; some de `/relatorios` ("2 relatórios") e o download volta a `404` |
| Editor na Tela 6 | Nenhum botão de publicar ou despublicar |
| Editor cadastra Número de leitos 2026/1 = 350 | `201`, rascunho |
| Editor sobe `OT-ILUS-02-2025-impacto-economico.pdf` | `201`, rascunho; Tela 8 sem a coluna de ações |
| Editor chama `PATCH .../status` direto, com o token da sessão | `403` `{ "erro": "Seu perfil não pode publicar conteúdo" }` em medição e em relatório; nada aparece no portal |

No console do navegador, os únicos erros foram os das respostas esperadas (`409` da duplicada e os dois `403` do editor). Nenhuma tela rolou na horizontal em 375 px.

## Capturas

Cada passo tem `-1280.png` e `-375.png`. No celular, as capturas das Telas 6 e 8 do administrador mostram a tabela rolada até a coluna de ações.

| Arquivo | O que mostra |
|---|---|
| `01-admin-medicao-rascunho` | Tela 7 depois de salvar a medição como rascunho |
| `02-admin-medicao-duplicada-409` | Mensagem do `409` ao repetir indicador e período |
| `03-admin-tela6-confirmar-publicacao` | Diálogo de confirmação antes de publicar |
| `04-admin-tela6-publicada` | Medição publicada, contador em 24 e mensagem de sucesso |
| `05-dashboard-2026-1-publicada` | Dashboard público filtrado em 2026/1 com o card |
| `06-admin-tela6-despublicada` | Medição de volta a rascunho |
| `07-dashboard-despublicada` | Dashboard depois de despublicar: 2026 sai do filtro e o card volta a 2025/2 |
| `08-admin-tela8-rascunho` | Relatório enviado como rascunho |
| `09-admin-tela8-confirmar-publicacao` | Diálogo de confirmação do relatório |
| `10-admin-tela8-publicado` | Relatório publicado na Tela 8 |
| `11-relatorios-publicado` | `/relatorios` com o relatório de teste |
| `12-relatorios-despublicado` | `/relatorios` depois de despublicar |
| `13-editor-tela6-sem-publicar` | Tela 6 do editor, filtrada em rascunho, sem botões de publicar |
| `14-editor-tela8-rascunho` | Tela 8 do editor depois do envio, sem a coluna de ações |

## Problemas encontrados

Nenhum bloqueia o fluxo. Ficaram anotados no PR para decidir se viram issue:

1. **Variação de 0% aparece como alta.** O card mostra "↑ 0%" em verde (print `05`), porque `CardIndicador` trata `variation >= 0` como positivo. Aconteceu porque a medição de teste repete o valor do período anterior.
2. **Nomes acessíveis repetidos na Tela 6.** As três medições "Participação econômica" de 2025/2 (setores diferentes) têm botões com o mesmo nome, "Despublicar Participação econômica, 2025/2" e "Editar Participação econômica, 2025/2"; o diálogo e a mensagem de sucesso também não dizem o setor. Quem usa leitor de tela não sabe qual linha está alterando.
