# Evidências do PR #199: serviços e mocks de relatórios

Entrega da #186, conforme o [contrato da API](../../contrato-api.md). Foram adicionados os serviços de consulta e URL de download, os mocks de relatórios e seus testes. Esta tarefa não altera telas, componentes visuais ou estilos; a página do Stitch será implementada na #187.

## Serviços

```js
getRelatorios();
getRelatorios({ ano: 2026 });
getRelatorios({ ano: 2026, categoria: 'Impacto Econômico' });
urlDownloadRelatorio(2);
```

Com a base local padrão e o mock desligado, esses exemplos usam:

```text
http://localhost:3000/api/relatorios
http://localhost:3000/api/relatorios?ano=2026
http://localhost:3000/api/relatorios?ano=2026&categoria=Impacto+Econ%C3%B4mico
http://localhost:3000/api/relatorios/2/arquivo
```

Somente `ano` e `categoria` preenchidos entram na consulta. A base vem de `VITE_API_URL`, sem `/api` no final, seguindo os serviços existentes. A função de download apenas monta a URL; o botão e o tratamento visual do download pertencem à #189.

Com `VITE_USE_MOCK=true`, a consulta usa cópias dos dados ilustrativos e não chama a API. Falhas no modo real nunca ativam o mock automaticamente. Mensagens `{ erro }` do contrato são preservadas; falhas de rede e respostas ilegíveis geram “Não foi possível consultar os relatórios. Tente novamente.” O envio do token e o encerramento da sessão com `401` seguem o serviço existente.

## Consistência da carga

| ID no mock | Título | Edição | Categoria | Publicação | Tamanho |
|---|---|---|---|---|---|
| 1 | Indicadores do setor hoteleiro | OT-ILUS-01/2025 | Setor Hoteleiro | 21/10/2026 | 193 KB |
| 2 | Participação econômica do turismo | OT-ILUS-02/2025 | Impacto Econômico | 21/10/2026 | 231 KB |

O teste lê `backend/prisma/dados/relatorios/relatorios.json`, compara todos os metadados públicos e confere os tamanhos com os arquivos PDF: `Math.ceil(bytes / 1024)`. Não são expostos os campos internos `arquivo`, `fonte`, `arquivo_url` ou `id_usuario`.

O JSON de origem não contém IDs. Os IDs 1 e 2 acompanham a ordem de criação em banco vazio do seed proposto no PR #198, ainda aberto nesta validação. A comparação automatizada verifica essa ordem; não foi executada uma carga real de relatórios nesta entrega. Em banco já preenchido, os IDs podem diferir: o serviço mantém os IDs e URLs retornados pela API.

O ano filtrado é o de `data_publicacao`: 2026 retorna os dois relatórios, enquanto 2025 retorna vazio, apesar da edição. As quatro categorias do contrato são aceitas; categorias válidas sem dados retornam `[]`. Ano malformado e categoria desconhecida geram as mensagens do contrato. A ordem é da publicação mais recente para a mais antiga.

## Validação

Executado em `frontend/`:

```bash
npm test -- --maxWorkers=2
npm run lint
npm run build
```

Após a revisão, o caminho da carga no teste passou a ser resolvido a partir de `import.meta.url`, sem depender do diretório de execução. Também foi conferida a execução a partir da raiz do repositório:

```bash
node frontend/node_modules/vitest/vitest.mjs run --root frontend --maxWorkers=2 src/__tests__/relatorios.api.test.js
```

Os 18 testes de relatórios passaram nessa execução.

- 23 arquivos e 203 testes passaram, incluindo 18 testes novos de relatórios.
- Lint aprovado.
- Build aprovado, com o aviso existente de bundle acima de 500 kB.
- URLs sem filtro, por ano, por categoria, com filtros combinados e com valores vazios verificadas por testes.
- URL do download e base de API alternativa com barra final verificadas por testes.
- Mensagem da API, falha de rede, resposta ilegível, token e `401` verificados por testes.
- Mocks conferidos contra os metadados e tamanhos reais dos PDFs; filtragem, ordenação e cópias independentes verificadas por testes.

A integração HTTP foi verificada com respostas simuladas no teste do serviço. A rota pública real depende da #153; o endpoint de download depende da #170. Não foram alterados backend, seed, dependências ou configuração de CI.
