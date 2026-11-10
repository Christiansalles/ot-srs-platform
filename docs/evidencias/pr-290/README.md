# Evidências do PR #290: página 404

Capturas feitas no Edge com Docker Compose e API real, em um ambiente isolado com o frontend na porta 8266.

| Arquivo | O que mostra |
|---|---|
| `pagina-404-375.png` | `/admin/endereco-invalido` em 375 px |
| `pagina-404-1280.png` | `/endereco-invalido` em 1280 px |

Os dois endereços exibem o mesmo layout público, com cabeçalho, rodapé e link para a página inicial. A abertura direta e o retorno à Home com Tab e Enter foram verificados em 320, 375, 768 e 1280 px, sem transbordamento horizontal na 404 ou erros no console. O acesso a `/admin` sem sessão redirecionou para o login.
