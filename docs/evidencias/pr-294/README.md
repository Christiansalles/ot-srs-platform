# Evidências do PR #294: tabela de Indicadores no celular

Capturas de `/indicadores?setor=1&ano=2025` no Edge com Vite e `VITE_USE_MOCK=true`. O antes foi registrado na `develop` em `5e76f0f`.

| Arquivo | O que mostra |
|---|---|
| `antes-390.png` | Tabela original com as primeiras colunas visíveis |
| `depois-320.png` e `depois-375.png` | Início da tabela com a instrução de rolagem |
| `rolagem-375.png` e `rolagem-390.png` | Coluna Indicador fixa ao rolar até Ano, Semestre e Valor |
| `depois-768.png` e `depois-1280.png` | Tabela no layout de tablet e desktop |

O teste Playwright verificou a rolagem por teclado e a posição da primeira coluna em 390 px. No Edge com Docker Compose e API real, também foram verificados o gesto de toque em 320, 375 e 390 px e a leitura de Unidade, Ano e Valor dentro do contêiner.
