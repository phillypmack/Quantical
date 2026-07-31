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

---

# Problemas do servidor

Todos corrigidos em 31/07/2026. Os scripts vivem em
[`deploy/vps/`](../deploy/vps/), **numerados na ordem em que rodaram**. São
idempotentes e imprimem o rollback ao final.

## Verificação contínua

```bash
ssh root@187.77.8.195 /usr/local/sbin/verifica-invariantes.sh
```

Doze invariantes, rodando também por cron às 6h10 em
`/var/log/vps-invariantes.log`. Sai 1 e diz o que regrediu se: o perfil sumir
do disco ou sair de *enforce*, a regra de sinal desaparecer, **o template do
dockerd mudar e o perfil congelado ficar defasado** (o caso mais escorregadio,
que acontece calado depois de um refresh do snap), aparecerem negações novas,
o `docker.service` deixar de estar mascarado, alguma regra de DROP sumir da
`DOCKER-USER`, ou algum banco voltar a publicar em `0.0.0.0`.

O timer do snap passou de `00:00~24:00/4` (quatro refreshes por dia, a
qualquer hora) para **domingo 03:00–05:00**. Um refresh do snap docker
reinicia o daemon e, com ele, os 17 containers dos 8 projetos — melhor que
isso aconteça numa madrugada previsível do que numa terça às 14h.

## 1. `docker stop` não funciona em container nenhum — CORRIGIDO

**Estado: aplicado em 31/07/2026 17:59 UTC e verificado.** `docker stop` e
`docker start` funcionaram em `quantical-api`, e um SIGCONT (inócuo num
processo que já roda, mas exerce o caminho de sinal) passou nos **17**
containers. Zero negações desde então.

O sintoma: `docker stop <qualquer container>` responde `permission denied`,
em qualquer projeto do servidor. Foram 181 negações nos últimos 7 dias.

```
apparmor="DENIED" operation="signal" class="signal" profile="docker-default"
  requested_mask="receive" denied_mask="receive" signal=kill
  peer="snap.docker.dockerd"
```

**A causa não é "AppArmor mal configurado".** É mais específica:

O perfil `docker-default` **não tem arquivo em lugar nenhum do disco**
(`ls /etc/apparmor.d/docker*` → *No such file*). O próprio dockerd o gera em
memória, a partir de um template Go embutido no binário, grava num arquivo
temporário e carrega com `apparmor_parser`. Por isso não havia nada para
editar.

E há **dois dockerds** nesta máquina:

| | docker.service (.deb) | snap.docker.dockerd |
|---|---|---|
| Versão | 29.2.1 | **29.3.1** |
| PID | 996 | **817** |
| Confinamento | `unconfined` | `snap.docker.dockerd (enforce)` |
| Containers | 1, parado desde fevereiro | **os 17 de produção** |
| Data root | `/var/lib/docker` — **244 KB** | `/var/snap/docker/common/var-lib-docker` — **43 GB** |

No boot de 20/07 o dockerd do `.deb` carregou o perfil às **06:57:07**, antes
de o do snap chegar nessa etapa (o containerd dele só apareceu às 06:57:17).
Como o dockerd faz *early-return* quando o perfil já está carregado, o do snap
nunca o corrigiu.

Só que o template é parametrizado pelo confinamento de **quem renderiza**:

```
  # dockerd may send signals to container processes (for "docker kill").
  signal (receive) peer={{.DaemonProfile}},
{{if .SnapSecurityLabel}}
  signal (receive) peer="{{.SnapSecurityLabel}}",
{{end}}
```

Renderizado pelo daemon do `.deb`, que roda unconfined, `{{.DaemonProfile}}`
virou `unconfined` e o bloco do snap **não foi emitido**. O perfil em kernel
simplesmente não autoriza receber sinal de `snap.docker.dockerd` — que é
justamente quem manda os sinais.

### A correção (já aplicada)

Materializar o perfil em `/etc/apparmor.d/docker-default`, renderizado do
template do binário **do snap**, com os valores certos.

```bash
./deploy/vps/03a-valida-apparmor.sh    # renderiza e prova — não altera nada
./deploy/vps/03b-aplica-apparmor.sh /root/aa-<carimbo>
```

**Zero downtime:** `apparmor_parser -r` substitui o perfil atomicamente e as
tarefas já confinadas migram para a nova versão sem reiniciar. Nenhum
container para.

**Persiste:** o `apparmor.service` carrega `/etc/apparmor.d` ~34 s antes de
qualquer dockerd, então nos próximos boots os **dois** daemons caem no
early-return e o perfil bom prevalece.

**A prova de que é seguro.** Substituir um perfil vale imediatamente para os
115 processos confinados dos 8 projetos — um perfil incompleto quebraria tudo
de uma vez. Por isso o renderizador não se limita a renderizar; ele trava em
quatro pontos, e já rodou com sucesso no servidor:

```
trava 1 OK: 19 regras não-peer idênticas nas duas versões
trava 2 OK: superconjunto estrito, 4 regra(s) a mais
  nova: ptrace (readby, tracedby) peer="snap.docker.dockerd",
  nova: signal (receive) peer="snap.docker.dockerd",
  nova: signal (receive) peer=snap.docker.dockerd,
  nova: signal (send, receive) peer=docker-default,
trava 3 OK: signal (receive) peer="snap.docker.dockerd",
trava 4 OK: sem abi, 15 regras deny preservadas
parse OK
```

O diff contra o perfil em vigor é de **uma linha trocada** — e ela era
duplicata de outra logo acima, então nada se perde:

```diff
-  signal (receive) peer=unconfined,
+  signal (receive) peer=snap.docker.dockerd,
```

mais o bloco de 6 linhas do snap. **Nenhuma regra `deny` sai, nenhuma
permissão é retirada.** Sendo superconjunto estrito, o perfil novo não tem
como negar nada que hoje funciona.

Rollback, sem reiniciar nada:

```bash
ssh root@187.77.8.195 'install -m 0644 /root/aa-<carimbo>/docker-default.rollback \
  /etc/apparmor.d/docker-default && apparmor_parser -r /etc/apparmor.d/docker-default'
```

E o alívio imediato, se algo inesperado aparecer:
`apparmor_parser -r -C /etc/apparmor.d/docker-default` recarrega em *complain*
— para de negar na hora, sem descarregar nada. É paliativo de minutos, não
estado estável: um reboot ou um `systemctl reload apparmor` volta a *enforce*.

### 1b. A corrida de boot — CORRIGIDA

```bash
./deploy/vps/04-mask-docker-deb.sh   # aplicado em 31/07/2026
```

`systemctl mask docker.service docker.socket` impede o daemon do `.deb` de
subir nos próximos boots e **não para o processo que roda agora** — risco zero
no instante da aplicação.

> **NÃO remova o snap.** Uma versão anterior deste documento sugeria
> `snap remove docker` "para manter o docker-ce do apt". Isso teria sido
> catastrófico: os 43 GB de volumes e os 17 containers de produção estão no
> data root do **snap**. O data root do `.deb` tem 244 KB.

Parar o `docker.service` agora também não vale o risco: `/var/run` é symlink
para `/run`, os dois daemons disputaram o **mesmo** caminho de socket, e o
socket que existe hoje é o do snap. Parar a `docker.socket` do systemd pode
remover esse arquivo e deixar o CLI sem alcançar o daemon do snap — os
containers seguiriam rodando, mas ninguém conseguiria administrá-los.

### Manutenção futura do perfil

O arquivo `/etc/apparmor.d/docker-default` congela o perfil na versão 29.3.1.
**Depois de todo refresh do snap docker**, rode `03a-valida-apparmor.sh` de
novo: a trava 1 compara os templates das duas versões e acusa se as regras
mudaram.

O auto-refresh do snap está **segurado até 2026-08-03**
(`snap refresh --hold=72h docker`) — sem isso ele reiniciaria o daemon e
derrubaria os 17 containers no meio da intervenção. Ao liberar, prefira fixar
uma janela em vez de deixar solto:

```bash
snap set system refresh.timer=sun,03:00-05:00
```

> Cuidado: `snap refresh --hold` **sem argumentos** não é consulta — ele
> aplica um hold indefinido em *todos* os snaps. Para consultar, leia
> `snaps-hold` em `/var/lib/snapd/state.json`.

## 2. Postgres da dona-lia exposto à internet — CORRIGIDO

**Estado: fechado e verificado de fora.**

`donalia-postgres` publicava `0.0.0.0:5433`. Teste de conexão a partir de uma
máquina externa confirmou que **respondia**. E o banco aceita qualquer origem
com senha:

```
pg_hba.conf:      host all all all scram-sha-256
postgresql.conf:  listen_addresses = '*'
```

O log do container mostra varredura recorrente desde 19/06 — pacotes de
startup malformados e protocolo inválido, assinatura de `masscan`/`zgrab`.

O `ufw` não protegia: ele só filtra o `INPUT`, e porta publicada por container
é DNAT'ada em `nat/PREROUTING` e segue pelo `FORWARD`. É o bypass clássico do
Docker sobre o ufw.

```bash
./deploy/vps/01-fecha-portas.sh
```

Fecha pela cadeia `DOCKER-USER`, que é o ponto de extensão oficial, **sem
tocar em container nenhum** — o que importava, já que recriar container estava
bloqueado pelo problema 1. Verificado de fora: `5433 fechada`, e a `3002`
segue aberta de propósito.

O script corrigiu três defeitos do mecanismo que já existia:

1. O serviço tinha `Requires=docker.service` — o daemon do `.deb`, que **não**
   é quem serve os containers. Como ele vai ser mascarado, esse `Requires`
   faria o serviço falhar no boot e as portas reabririam em silêncio. Agora
   aponta para `snap.docker.dockerd.service`.
2. O Docker **limpa a cadeia `DOCKER-USER`** toda vez que o daemon sobe. Sendo
   `oneshot` + `RemainAfterExit`, o serviço nunca re-executava: um restart do
   daemon reabria 3001 e 8090 para a internet sem nenhum aviso. `PartOf=`
   corrige.
3. A cadeia `DOCKER-USER` do `ip6tables` estava vazia.

E a defesa em profundidade, aplicada depois que o problema 1 destravou a
recriação de containers:

```bash
./deploy/vps/05-donalia-loopback.sh   # aplicado em 31/07/2026
```

O compose passou a declarar `127.0.0.1:5433:5432`, o container foi recriado e
o app reconectou (DNS interno resolve `postgres` para 172.23.0.3, resposta 307
do NextAuth em 0,45 s). A porta deixou de ser publicada, em vez de ser
publicada e bloqueada: se um dia a regra de firewall sumir, ela não reabre.

### Ainda em aberto na dona-lia (não é projeto meu, mas é sério)

- **A senha do superusuário `donalia` segue o padrão trivial `<usuário>123`.**
  Mesmo com a porta fechada, vale trocar: `ALTER USER` + `POSTGRES_PASSWORD`
  no compose + `DATABASE_URL` do app.
- **`donalia-app` está crua em `0.0.0.0:3002`** — sem nginx, sem TLS, sem
  domínio. Todo o tráfego, login incluso, vai em HTTP puro. E o
  `NEXTAUTH_SECRET` tem fallback default no compose
  (`${NEXTAUTH_SECRET:-dona-lia-secret-change-me}`). Fechar a porta hoje
  derruba o acesso: o caminho é criar um vhost com TLS primeiro.

## 3. Backup dos bancos — PARCIALMENTE RESOLVIDO

Antes, só o quantical tinha (e o cron dele ainda não havia rodado). Em
31/07/2026 os seis bancos pequenos foram salvos em
`/var/backups/vps-20260731-175927/`, cada um validado com `pg_restore -l`:
quantical, chess2, tablegames, dona_lia_estoque, container_loader e
chaveirogo — 552 KB no total.

**O warzil (17 GB) continua sem backup**, e é o único que realmente tem
volume de dados.

```bash
./deploy/vps/02-backup-bancos.sh                 # os seis pequenos (~65 MB)
./deploy/vps/02-backup-bancos.sh usuario@host --com-warzil
```

O warzil fica de fora por padrão, e por um bom motivo: ele tem **17 GB** —
99,6% de todos os dados do servidor; os outros seis somados dão ~65 MB. O
disco é um filesystem único com **23 GB livres, sem swap** e ~250 MB de RAM
livre. Escrever um dump de vários GB ali, com 7 Postgres ativos no mesmo
disco, é a operação mais perigosa deste servidor. O script aborta sozinho se o
espaço livre cair abaixo de 8 GB.

Se for fazer o do warzil, o mais seguro é **não gravar na VPS**:

```bash
ssh root@187.77.8.195 "docker exec warzil-postgres pg_dump -U warzil -d warzil -Fc -Z9 --no-owner" > warzil.dump
```

## Armadilhas do servidor, encontradas na apuração

- **`chess2-postgres` e `tablegames-postgres` foram criados à mão**, sem
  compose e sem labels. São irreproduzíveis a partir do disco: se forem
  removidos, ninguém sabe recriá-los. **Não rode `docker rm` neles.** Os dados
  estão em volumes nomeados (`chess2-pgdata`, `tablegames-pgdata`), então
  sobrevivem — mas o container, não.
- **`/var/www/rohnelt/docker-compose.yml` é um compose fantasma** que duplica
  `rohnelt-portfolio` e ainda declara um container nginx tomando as portas 80 e
  443 do host. Um `docker compose up` nesse diretório **derrubaria todos os
  sites da VPS**. O compose real, em uso, é `/root/rohnelt`.
- **O compose do warzil não declara `restart:`.** Os containers em execução
  estão `unless-stopped`, mas um `docker compose up -d` em `/opt/warzil` os
  recriaria com `restart=no`, e no próximo restart do daemon o warzil não
  voltaria sozinho.
- **Composes dormentes colidem com portas vivas:** `container-loader-dev`
  reserva `127.0.0.1:5432` e `127.0.0.1:3000`, as mesmas do container-loader
  em produção.
- Todos os 20 containers têm `restart=unless-stopped`. Numa parada do daemon
  do snap, todos voltam sozinhos — inclusive os dois criados à mão.
- `3020` e `3021` (tablegames, processos PM2 no host, não containers) estão
  abertos ao mundo por regra explícita do `ufw`. Convém confirmar se é
  intencional.
