# Operação

Como o Quantical vive na VPS `root@187.77.8.195`, o que precisa de atenção e o
que está quebrado no servidor.

## A regra que governa tudo

**O site é estático e funciona inteiro sem a API.** O `localStorage` é a fonte
da verdade da sessão; o banco é durabilidade e agregação. Se o container cair,
o aluno continua estudando: a aula responde, o simulador roda, o desafio
corrige, o progresso aparece e a revisão funciona — porque o agendamento é
decidido no cliente.

Isso não é intenção, é teste: `com a API fora do ar, o site inteiro continua
funcionando` em `tests/e2e/learning.spec.ts` aborta toda chamada a `/api/**`
com `connectionrefused` e percorre o site inteiro. Se alguém tornar a API
caminho crítico, esse teste quebra.

## O que roda no servidor

| Peça | Onde | Porta |
|---|---|---|
| Site estático | `/var/www/quantical` (nginx) | 443 |
| Áudio dos episódios | `/var/www/quantical-audio` | — |
| Postgres | `quantical-postgres` (Docker) | `127.0.0.1:5441` |
| API | `quantical-api` (Docker) | `127.0.0.1:6002` |

Nem 5441 nem 6002 são alcançáveis pela internet — o `deploy-api.sh` confere
isso e falha se alguma abrir.

O compose e o `.env` moram em `/var/www/quantical-api/`. **O `.env` tem a
senha do banco, é gerado uma vez e nunca entra no repositório.** Um deploy
seguinte o preserva; regravar quebraria o banco existente.

## Publicar

```bash
./scripts/deploy.sh       # site: build, troca atômica, nginx, confere 74 rotas
./scripts/deploy-api.sh   # banco + API + cron do backup
./scripts/deploy-audio.sh # mp3 dos episódios (upload incremental por md5)
```

E a fumaça de produção, que exercita o ciclo inteiro sem nenhuma rota simulada:

```bash
PLAYWRIGHT_BASE_URL=https://quantical.com.br npx playwright test producao
```

Ela grava tentativas de verdade no banco com um `alunoId` descartável. Para
limpar depois:

```sql
delete from aluno where id = '<o id impresso pelo teste>';
```

## Backup

`/var/www/quantical-api/backup-db.sh`, diário às 3h20 no crontab do root.
Guarda em `/var/backups/quantical/`, retenção de 14 dias, testado com
`gzip -t` antes de contar como backup — um `.sql.gz` truncado com nome
definitivo é pior que backup nenhum, porque parece que existe.

Restaurar:

```bash
cd /var/www/quantical-api && set -a && . ./.env && set +a
gunzip -c /var/backups/quantical/quantical-AAAAMMDD-HHMMSS.sql.gz \
  | docker exec -i quantical-postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
```

O dump é `--clean --if-exists`, então restaura sobre um banco já existente,
que é o cenário real de uma restauração às pressas.

## ⚠️ Problema aberto no servidor: dois Dockers brigando

**Containers não podem ser parados nem reiniciados nesta VPS.** Isso afeta
todos os projetos do servidor, não só o Quantical.

```
$ docker stop quantical-api
Error response from daemon: cannot stop container: permission denied
```

A causa está no `dmesg`:

```
apparmor="DENIED" operation="signal" profile="docker-default"
  requested_mask="receive" denied_mask="receive" signal=kill
  peer="snap.docker.dockerd"
```

E a razão de fundo é que o Docker está instalado **duas vezes**, com os dois
daemons rodando ao mesmo tempo:

- `docker.service` — apt, `docker-ce 29.2.1`, pid 996, socket `/run/docker.sock`
- `snap.docker.dockerd.service` — snap, `29.3.1`, pid 817, socket `/var/run/docker.sock`

O daemon do snap ficou com o socket, e o perfil AppArmor `docker-default`
(do pacote apt) não autoriza o peer `snap.docker.dockerd` a sinalizar os
containers. Resultado: criar funciona, parar não.

**Consequência prática:** a API está no ar e funcionando, mas **uma alteração
em `deploy/api/server.mjs` não pode ser publicada** — o `docker compose up`
precisaria parar o container antigo para trocá-lo.

A correção é remover um dos dois Dockers, e isso **para todos os containers do
servidor** — chaveirogo, chess2, container-loader, dona-lia, tablegames,
warzil. Não é uma decisão para tomar sozinho, então ficou aqui em vez de ser
executada. O caminho seria, numa janela combinada:

```bash
snap remove docker            # mantém o docker-ce do apt, que é o padrão dos outros projetos
systemctl restart docker
docker compose -f /var/www/<cada projeto>/docker-compose.yml up -d
```

Conferir antes quais volumes pertencem a qual daemon — o snap guarda os dados
em `/var/snap/docker/common/var-lib-docker`, e o apt em `/var/lib/docker`.

## Outra coisa que vi

`donalia-postgres` está publicado em `0.0.0.0:5433`, ou seja, **aceita conexão
da internet inteira**. Todos os outros bancos do servidor estão presos a
`127.0.0.1`. Não é projeto meu, mas vale trocar para
`127.0.0.1:5433:5432` no compose do dona-lia.
