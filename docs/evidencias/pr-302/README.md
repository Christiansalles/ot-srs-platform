# Evidências do PR #302 · Painel no celular

Capturas no Chromium do Playwright, com Vite e API real do Docker Compose isolado. O antes foi registrado na `develop` em `df5a9ac`.

| Arquivo | O que mostra |
|---|---|
| `antes-painel-375.png` e `painel-375.png` | Painel antes e depois, com dica de rolagem na tabela e controles maiores |
| `login-375.png` | Login com área de toque maior para mostrar a senha |
| `medicao-375.png` | Formulário de cadastro com campos e ações em uma coluna |
| `relatorios-375.png` | Upload e lista de relatórios |
| `usuarios-375.png` e `usuarios-acoes-375.png` | Cadastro e tabela de usuários, com acesso às ações ao rolar |
| `gaveta-375.png` | Gaveta aberta com os módulos do administrador |
| `painel-320.png`, `painel-768.png` e `painel-1280.png` | Conferência em outras larguras |

O E2E de 375 px cobre a área de toque dos controles, o fechamento da gaveta, a rolagem por teclado dentro das tabelas e o acesso às ações das linhas. O CT-24 cobre login, cadastro e upload no projeto celular.
