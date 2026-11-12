# PR #301: gestão de usuários

Issue #263, entrega E11, Milestone 7. Substitui o PR #292 para corrigir o nome da branch. Capturas no Microsoft Edge.

## Capturas da revisão

Em 11/11/2026, com frontend local e respostas simuladas no navegador no formato da API. A sessão é de administrador e a lista usa os três usuários da carga de desenvolvimento. As respostas simuladas permitem reproduzir o `409`, o sucesso e os estados da lista sem modificar o banco.

| Arquivos | O que mostram |
|---|---|
| `usuarios-375.png`, `usuarios-1280.png` | Lista e cadastro, após a correção |
| `editar-perfil-375.png`, `editar-perfil-1280.png` | Cartão de edição com foco, campo visível após clicar na ação |
| `redefinir-senha-375.png`, `redefinir-senha-1280.png` | Redefinição de senha com foco e campo visível |
| `erro-edicao-375.png`, `erro-edicao-1280.png` | Erro `409` dentro da edição, visível e com foco; perfil digitado preservado |
| `sucesso-edicao-375.png`, `sucesso-edicao-1280.png` | Confirmação visível e com foco após salvar |
| `usuarios-carregando-375.png`, `usuarios-carregando-1280.png` | Carregamento da lista |
| `usuarios-vazio-375.png`, `usuarios-vazio-1280.png` | Lista vazia |
| `usuarios-erro-375.png`, `usuarios-erro-1280.png` | Falha ao carregar a lista e botão de nova tentativa |

Janelas de 375 x 812 e 1280 x 800 px. As capturas de edição e mensagens mostram a janela visível; as demais mostram a página inteira. Conferido no navegador: foco no cartão ao abrir, erro e sucesso inteiramente visíveis, campo de senha visível, nenhuma rolagem horizontal no documento e nenhuma rolagem horizontal na tabela em 1280 px. No celular, a tabela mantém sua rolagem própria.

## Capturas anteriores

`usuarios-antes-390.png` e `usuarios-antes-1280.png`: capturadas em 09/11/2026 com a API real em Docker Compose isolado. Incluem um usuário criado e desativado nesse banco de teste. Foram preservadas para comparação com a versão anterior da tela.

## Validação com API real em 12/11/2026

Os arquivos JPEG foram capturados no Chromium do navegador integrado, com o sistema inteiro em Docker Compose isolado (`ot-revisao-maria`), frontend em 8382, API em 3302 e PostgreSQL 18. Só usuários e senhas de desenvolvimento do Compose foram usados.

| Arquivos | O que mostram |
|---|---|
| `usuarios-390.jpg`, `usuarios-1280.jpg` | Tela atual com o título da aba integrado ao hook do projeto |
| `edicao-390.jpg`, `edicao-1280.jpg` | Campo Novo perfil visível e focado após a ação na tabela |
| `erro-edicao-390.jpg`, `erro-edicao-1280.jpg` | Erro real 409 junto da edição, com foco e valor preservado |
| `sucesso-390.jpg`, `sucesso-1280.jpg` | Sucesso real após salvar o perfil do editor sem trocar seu valor |
| `referencia-painel-390.jpg`, `referencia-painel-1280.jpg` | Tela 6 na mesma largura, como referência da base visual |

As imagens de edição e mensagem mostram a janela visível, sem rolagem manual posterior à ação. O campo de senha também foi conferido em 320 px: foco no campo, sem transbordamento horizontal do documento. A tabela ocupa 919 px numa área de 919 px em desktop, sem a barra excedente.

O teste `usuarios.spec.js` cobre foco, posição na janela, erro 409, valor preservado, cancelamento, sucesso, duplicidade de e-mail (CT-32) e bloqueio do editor (CT-29), em desktop e celular. A tela também entrou no axe (CT-35); o contraste do selo Ativo e das mensagens de sucesso foi ajustado nesta página. As capturas PNG anteriores foram preservadas com sua origem descrita acima.
