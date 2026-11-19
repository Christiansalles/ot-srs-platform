# Guia de implantação

Para quem vai instalar a plataforma do Observatório do Turismo num servidor da SMCELT ou do município. Não precisa saber programar, mas precisa usar o terminal do servidor. Quem só vai cadastrar e publicar dados usa o [manual do painel](manual-do-painel.md); quem vai mexer no código usa o [README](../README.md).

Os comandos são para um servidor Linux com `bash`. Onde aparece `servidor.exemplo`, use o endereço do servidor (nome ou IP).

## 1. O que precisa no servidor

- **Docker Engine** com o **Docker Compose** (o comando `docker compose`, sem hífen). Confira com `docker compose version`.
- **Git**, para baixar e atualizar o código.
- Acesso à internet na instalação e em cada atualização: o Docker baixa as imagens do PostgreSQL, do Node e do Nginx e as dependências do projeto.
- As portas **8080** (portal e painel) e **3000** (API) liberadas para quem vai usar o sistema. O navegador de quem acessa o portal fala direto com a API, por isso as duas precisam estar abertas.

Para o sistema voltar sozinho depois de reiniciar o servidor, o Docker precisa iniciar com a máquina (na maioria das distribuições, `sudo systemctl enable docker`). Os serviços do Compose já estão com `restart: unless-stopped`.

## 2. Baixar o código

```bash
git clone https://github.com/Christiansalles/ot-srs-platform.git
cd ot-srs-platform
git checkout v1.0.0
```

`v1.0.0` é a versão entregue no fim da disciplina. Se houver uma versão mais nova, use a tag dela (veja as *releases* do repositório).

## 3. Trocar as senhas de desenvolvimento antes de ligar

O `docker-compose.yml` traz valores de desenvolvimento, que estão no GitHub para qualquer um ver. **Antes de subir pela primeira vez**, crie um arquivo `.env` na pasta do projeto (ao lado do `docker-compose.yml`) com os valores do município. O Compose lê esse arquivo sozinho, e o Git não o envia para o GitHub.

Gere um valor aleatório para cada segredo:

```bash
openssl rand -hex 32
```

Rode uma vez para o `JWT_SECRET` e outra para a senha do banco. Use só letras e números nas senhas deste arquivo: a senha do banco entra num endereço de conexão, e caracteres como `@`, `:`, `/` ou `$` quebram esse endereço ou a leitura do `.env`.

Modelo do `.env` (troque tudo o que está entre `<` e `>`):

```dotenv
# Banco: defina antes da primeira subida. Depois disso, trocar aqui não muda a senha do banco.
POSTGRES_PASSWORD=<valor gerado com openssl rand -hex 32>

# Assina os tokens de login. Se mudar depois, todo mundo precisa entrar de novo.
JWT_SECRET=<outro valor gerado com openssl rand -hex 32>

# Primeiro administrador (veja a seção 4).
ADMIN_EMAIL=<e-mail de quem vai administrar na SMCELT>
ADMIN_SENHA=<senha com pelo menos 12 letras e números>

# Vazios de propósito: não cria o editor de desenvolvimento.
EDITOR_EMAIL=
EDITOR_SENHA=

# Endereços que o navegador usa. Mudar estes dois exige subir com --build de novo.
VITE_API_URL=http://servidor.exemplo:3000
CORS_ORIGIN=http://servidor.exemplo:8080

# Banco e Adminer só para quem está no próprio servidor.
POSTGRES_PORT=127.0.0.1:5432
ADMINER_PORT=127.0.0.1:8081
```

O que cada linha resolve:

| Variável | Por que trocar |
|---|---|
| `POSTGRES_PASSWORD` | O padrão é `ot`. O PostgreSQL só usa esse valor quando cria o banco, na primeira subida; depois, trocar no `.env` não muda a senha guardada no volume. Não mude `POSTGRES_USER` nem `POSTGRES_DB`: os comandos de backup deste guia usam `ot` e `ot_srs`. |
| `JWT_SECRET` | Com o valor de desenvolvimento, qualquer pessoa consegue montar um login falso de administrador. |
| `ADMIN_EMAIL` e `ADMIN_SENHA` | Os de desenvolvimento estão publicados no README. |
| `EDITOR_EMAIL` e `EDITOR_SENHA` | Vazios, o sistema não cria o editor de desenvolvimento. A equipe ganha contas próprias pela tela Usuários. |
| `VITE_API_URL` | O padrão é `http://localhost:3000`, que só funciona no próprio servidor. Precisa ser o endereço que o navegador de quem acessa consegue abrir. |
| `CORS_ORIGIN` | Vazio, a API aceita chamadas de qualquer site. Com o endereço do portal, só ele chama a API. |
| `POSTGRES_PORT` e `ADMINER_PORT` | Por padrão, o banco (5432) e o Adminer (8081) ficam abertos para a rede. Com `127.0.0.1:` na frente, só quem está logado no servidor acessa. |

Se a 8080 ou a 3000 já estiverem em uso no servidor, acrescente `FRONTEND_PORT` e `BACKEND_PORT` com outras portas e ajuste `VITE_API_URL` e `CORS_ORIGIN` para elas.

## 4. Subir o sistema

```bash
docker compose up --build -d
```

A primeira vez demora alguns minutos. Ao iniciar, a API aplica as migrações do banco e roda a carga inicial (o *seed*) sozinha. Para acompanhar:

```bash
docker compose ps
docker compose logs -f backend
```

Está pronto quando o `backend` mostrar `API rodando em http://localhost:3000` (é o endereço de dentro do contêiner). Saia dos logs com Ctrl+C; o sistema continua rodando. Confira de fora:

- `http://servidor.exemplo:3000/api/health` responde `{"status":"ok"}`;
- `http://servidor.exemplo:8080` abre o portal;
- `http://servidor.exemplo:8080/admin/login` abre o login do painel.

## 5. Primeiro administrador e o resto da equipe

A cada início, a carga inicial garante um administrador com o `ADMIN_EMAIL` e a `ADMIN_SENHA` do `.env`. É com ele que se entra pela primeira vez em `/admin/login`.

Depois, esse administrador cria as contas da equipe em **Usuários**, no menu do painel: nome, e-mail, senha inicial (pelo menos 8 caracteres) e perfil. O `administrador` publica e gerencia usuários; o `editor` cadastra e sobe PDF, sempre como rascunho. O passo a passo com as telas está no [manual do painel](manual-do-painel.md).

O que vale saber sobre a conta do `.env`:

- **A senha dela é sempre a do `.env`.** Se for redefinida pela tela Usuários, ela volta a ser a do `.env` no próximo início da API. Para trocar, mude `ADMIN_SENHA` no `.env` e rode `docker compose up -d`.
- **Ela é sempre reativada.** Se alguém a desativar pela tela, ela volta ativa no próximo início.
- **Trocar o `ADMIN_EMAIL` cria outro administrador**, e o antigo continua existindo. Desative o antigo em Usuários.
- Usuário não se apaga, só se desativa, para o sistema lembrar quem lançou cada dado.

## 6. Dados ilustrativos

O sistema sobe com os indicadores e os dois relatórios em PDF que o grupo montou a partir dos protótipos, porque os dados oficiais da SMCELT não estavam disponíveis durante a disciplina. Todos estão marcados como ilustrativos, com a fonte.

Como a carga inicial roda a cada início da API, ela recoloca esses dados se tiverem sido apagados e deixa os dois relatórios ilustrativos publicados de novo, mesmo que alguém os tenha despublicado. Como trocar esses valores pelos oficiais está em [dados da carga](dados-da-carga.md).

## 7. Backup

Duas coisas precisam de cópia: o **banco** (indicadores, medições, usuários e cadastro dos relatórios) e a **pasta dos PDFs** enviados pelo painel. Uma sem a outra não serve: o banco aponta para arquivos da pasta.

Na pasta do projeto, com o sistema rodando:

```bash
mkdir -p backups
docker compose exec -T db pg_dump -U ot -d ot_srs -Fc > backups/banco-$(date +%F).dump
docker compose cp backend:/app/uploads backups/pdfs-$(date +%F)
```

Isso gera `backups/banco-<data>.dump` e a pasta `backups/pdfs-<data>/`. Guarde as duas fora do servidor. Faça um backup antes de toda atualização.

Para fazer todo dia, um agendamento no `cron` do servidor pode rodar esses três comandos dentro da pasta do projeto (lembre de escapar o `%` como `\%` dentro do `crontab`).

**Nunca use `docker compose down -v`.** O `-v` apaga os volumes, ou seja, o banco e os PDFs. Para parar o sistema, use só `docker compose down`.

## 8. Restauração

Para voltar a um backup (troque `AAAA-MM-DD` pela data dele):

```bash
docker compose stop backend
docker compose exec -T db pg_restore -U ot -d ot_srs --clean --if-exists < backups/banco-AAAA-MM-DD.dump
docker compose cp backups/pdfs-AAAA-MM-DD/. backend:/app/uploads/
docker compose run --rm --no-deps -u root --entrypoint chown backend -R node:node /app/uploads
docker compose start backend
```

A API fica parada durante a restauração, para ninguém gravar no meio. O `chown` devolve os PDFs ao usuário da API: o `docker compose cp` grava os arquivos como `root`, e sem esse passo a carga inicial não consegue regravar os PDFs ilustrativos e a API não sobe. Ao voltar, a carga inicial roda de novo (seção 6). Confira no painel que as medições e os relatórios voltaram e que um PDF baixa.

Num servidor novo, siga as seções 2 a 4 com o mesmo `.env` (inclusive a mesma `POSTGRES_PASSWORD`) e depois restaure.

## 9. Atualizar para uma versão nova

1. Faça um backup (seção 7).
2. Baixe a versão nova e suba de novo:

   ```bash
   git fetch --tags
   git checkout v1.0.1
   docker compose up --build -d
   ```

   Troque `v1.0.1` pela tag da versão nova. O `.env` não é tocado pelo Git, então as senhas continuam as mesmas.
3. Ao reiniciar, a API aplica sozinha as migrações novas do banco. Confira nos logs (`docker compose logs backend`) que não apareceu erro e abra o portal e o painel.

Se algo der errado, volte para a tag anterior (`git checkout v1.0.0` e `docker compose up --build -d`) e restaure o backup feito no passo 1.

## 10. Comandos do dia a dia

| Para | Comando |
|---|---|
| Ver se está tudo rodando | `docker compose ps` |
| Ver os logs da API | `docker compose logs -f backend` |
| Parar o sistema (os dados ficam) | `docker compose down` |
| Ligar de novo | `docker compose up -d` |
| Abrir o Adminer (com `ADMINER_PORT=127.0.0.1:8081`) | Do seu computador, `ssh -L 8081:localhost:8081 usuario@servidor.exemplo` e abra `http://localhost:8081` (servidor `db`, usuário `ot`, a senha do banco e o banco `ot_srs`) |

## O que este guia não cobre

- **HTTPS e domínio próprio.** O sistema sobe em HTTP nas portas 8080 e 3000. Para publicar com um endereço da prefeitura e HTTPS, a equipe de TI coloca um *proxy* reverso na frente (por exemplo, o que o município já usa nos outros sites) e ajusta `VITE_API_URL` e `CORS_ORIGIN` para os endereços novos.
- **"Esqueci minha senha"** por e-mail não existe: o administrador redefine a senha da pessoa na tela Usuários.
