# Evidências do PR #346: página do Cadastur e da FNRH Digital

Capturas de página inteira com `npm run dev` e `VITE_USE_MOCK=true`, no Chrome pelo Playwright, em 390 e 1280 px. A página é estática e não usa a API; o mock só preenche os destaques da Home. Na mesma conferência, em 320, 390 e 1280 px, nada rolou na horizontal e o axe não apontou violação.

| Arquivo | O que mostra |
|---|---|
| `cadastur-e-fnrh-390.png` | A página no celular: nota de que o Observatório não faz o cadastro nem tem integração, as seções Cadastur e FNRH Digital uma embaixo da outra, a fonte de cada trecho e o link no rodapé |
| `cadastur-e-fnrh-1280.png` | A mesma página no desktop, com as duas seções lado a lado |
| `home-390.png` | A Home no celular, com o bloco "Cadastur e FNRH Digital" depois de "Relatórios e análises" e o link no rodapé |
| `home-1280.png` | A Home no desktop, com o mesmo bloco e o link no rodapé; o menu principal continua sem o item |
