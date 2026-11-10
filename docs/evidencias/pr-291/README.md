# Evidências do PR #291: menu do celular

Capturas de `/relatorios` no Edge com Vite e `VITE_USE_MOCK=true`. A captura anterior veio da `develop` em `5e76f0f`.

| Arquivo | O que mostra |
|---|---|
| `antes-375.png` | Links quebrados em duas linhas e acesso administrativo visível no cabeçalho original |
| `depois-320.png` e `depois-375.png` | Cabeçalho compacto com o menu fechado |
| `menu-aberto-375.png` | Quatro links do portal e acesso administrativo no menu aberto |
| `depois-768.png` e `depois-1280.png` | Cabeçalho com os links e o acesso administrativo visíveis, idêntico às capturas anteriores nessas larguras |

Com Docker Compose isolado e API real, conferimos 320, 375, 390, 767, 768 e 1280 px. No celular, Tab, Espaço, Enter e Esc funcionaram com retorno de foco ao botão ao fechar. Também foram verificados a navegação para Dashboard e login, o fechamento após escolher um link e a ausência de rolagem horizontal no menu aberto e fechado.
