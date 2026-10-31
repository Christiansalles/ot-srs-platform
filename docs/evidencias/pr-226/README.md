# Evidências do PR #226: publicar e despublicar medições na Tela 6

Capturas com `VITE_USE_MOCK=true`, no Chrome, em 375 e 1280 px. O "antes" é a `develop` no commit `d191e05`; o "depois" é a branch `feat/E13-174-publicar-medicoes`. Só a resposta de `/api/auth/me` foi simulada, para escolher o perfil da sessão.

| Arquivo | O que mostra |
|---|---|
| `antes-painel-375.png`, `antes-painel-1280.png` | Tela 6 antes do PR: a medição em rascunho só tem "Editar" |
| `depois-painel-375.png`, `depois-painel-1280.png` | Tela 6 com o botão "Publicar" para o administrador |
| `confirmacao-publicar-375.png`, `confirmacao-publicar-1280.png` | Diálogo de confirmação antes de publicar |
| `publicada-375.png`, `publicada-1280.png` | Depois de confirmar: aviso de sucesso e contadores atualizados sem recarregar (publicadas de 22 para 23, rascunhos de 1 para 0) |
| `confirmacao-despublicar-375.png`, `confirmacao-despublicar-1280.png` | Diálogo de confirmação antes de despublicar |
| `editor-375.png`, `editor-1280.png` | Perfil editor: sem "Publicar" e "Despublicar", com "Editar" |

## O que ficou sem conferir

- **Portal público:** não há print do efeito no portal. No mock, as telas públicas leem uma lista separada, que a publicação no painel não altera, então um print com mock não provaria nada.
- **API real:** a publicação não foi feita com a API real. Os erros `403` e `404` estão cobertos em `frontend/src/__tests__/AdminPage.test.jsx`, com a resposta simulada.

A regra de que rascunho não aparece nas rotas públicas é coberta por `backend/tests/publicas.rascunho.test.js`.
