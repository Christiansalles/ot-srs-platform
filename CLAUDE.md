@AGENTS.md

## Claude Code

- As regras do projeto estão no `AGENTS.md` acima; `backend/CLAUDE.md` e `frontend/CLAUDE.md` carregam as de cada parte quando você trabalha nelas.
- Para uma tela, leia o HTML local em `docs/referencias/stitch/` em vez de abrir o projeto no Stitch: o MCP do Stitch costuma estourar o tempo, e o canvas no navegador trava a máquina.
- Prints de PR: use a skill `evidencias-pr` (`.claude/skills/evidencias-pr/`).
- Sempre que puder, rode os testes e o lint da parte que mudou antes de abrir o PR. Se algo não rodou, diga no PR o que ficou sem conferir.
- Use `gh` para issues e PRs. O quadro é o GitHub Project "OT SRS Platform" (`users/Christiansalles/projects/2`). Dependências entre issues usam a relação nativa `blocked_by` do GitHub, não só texto.
- No Windows, leia a saída do `gh` como UTF-8: acentos em campos do quadro já foram corrompidos por leitura em cp1252.
