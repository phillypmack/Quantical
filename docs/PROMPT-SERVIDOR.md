# Prompt: investigar e organizar a VPS

Copie tudo abaixo da linha para uma sessão nova de IA com acesso ao terminal.
O texto é autossuficiente — não depende de nada desta conversa.

Mantenha este arquivo atualizado: o que a IA descobrir e corrigir deve voltar
para cá, senão a próxima sessão recomeça do zero.

---

Você vai investigar e organizar uma VPS de produção. Acesso:
`ssh root@187.77.8.195`. É Ubuntu, com **8 projetos no ar**, servidos por
nginx e Docker.

Leia este prompt inteiro antes do primeiro comando.

## A pergunta que motiva o trabalho

**O banco do projeto `warzil` tem 17 GB e não deveria ter nunca.** Ele sozinho
é 99,6% de todos os dados do servidor — os outros seis bancos somados dão
65 MB.

Levantamento já feito (confirme, não confie):

| tabela | linhas | tamanho total |
|---|---|---|
| `match_snapshots` | 3.304.602 | **12 GB** |
| `score_history` | 26.898.965 | 3.443 MB |
| `orders` | 2.478.362 | 741 MB |
| `match_events` | 2.177.892 | 592 MB |
| `city_state` | 254.624 | 80 MB |

Em `match_snapshots`, o heap são 4.340 MB e os outros **7.754 MB são TOAST e
índices** — ou seja, o peso está em colunas grandes (jsonb, arrays), não na
quantidade de linhas em si.

**O que eu quero não é "apagou 12 GB".** Quero a resposta causal:

1. **Por que cresce?** Que código escreve nessas tabelas, com que frequência,
   e o que exatamente ele grava? Um snapshot por tick de partida? Estado
   inteiro serializado em vez de delta? Nenhuma retenção?
2. **Quanto disso é inchaço e quanto é dado real?** Uma tabela de 12 GB pode
   ser 6 GB de tuplas mortas que o autovacuum não deu conta. Isso muda
   completamente o conserto: `VACUUM` resolve inchaço, mas não resolve
   ausência de política de retenção.
3. **Qual a correção que faz parar de crescer?** Retenção, agregação em
   resumo, delta em vez de estado inteiro, particionamento por tempo,
   compressão. Sem isso, limpar hoje só adia.
4. **Só então:** quanto dá para recuperar e como, com segurança.

Traga evidência de comando para cada afirmação. Se não apurou, escreva "não
apurado" — nunca preencha com suposição.

## REGRAS INVIOLÁVEIS

Estas não são preferências. Cada uma corresponde a uma armadilha real deste
servidor, já verificada. Violar qualquer uma derruba produção.

### Docker

1. **Existem dois daemons Docker.** Quem serve os 17 containers e detém os
   43 GB de volumes é o do **snap** (`snap.docker.dockerd`, data root
   `/var/snap/docker/common/var-lib-docker`). O do pacote `.deb` está
   **mascarado** e tem data root de 244 KB. **Nunca remova o snap** e nunca
   desmascare o `.deb`.
2. **Nunca reinicie `snap.docker.dockerd`.** O cgroup dele contém o dockerd,
   o containerd, os 17 shims e todos os `docker-proxy` — reiniciar derruba os
   8 projetos de uma vez.
3. **O perfil AppArmor `/etc/apparmor.d/docker-default` é um render congelado**
   do template embutido no binário do dockerd. Se o snap atualizar e o
   template mudar, o perfil fica defasado em silêncio e `docker stop` volta a
   dar "permission denied" em todo container. Depois de todo refresh do snap
   docker, rode o renderizador de novo (ver "Ferramentas" abaixo).
4. **A imagem `postgres:16-alpine` é usada por 5 containers.** Nunca rode
   `docker image prune -a` sem conferir o que está em uso.
5. **`chess2-postgres` foi criado à mão**, sem compose e sem labels. É
   **irreproduzível a partir do disco**. Não rode `docker rm` nele. Os dados
   estão no volume nomeado `chess2-pgdata`.
6. **`docker compose down -v` apaga volume nomeado.** Nunca use `-v` neste
   servidor.
7. **O Docker limpa a cadeia `DOCKER-USER` toda vez que o daemon sobe.** As
   regras que fecham as portas 3001, 8090 e 5433 são reaplicadas pelo serviço
   `docker-portas-fechadas.service` (`PartOf=snap.docker.dockerd.service`).
   Não desabilite esse serviço.

### Arquivos e configuração

8. **`/var/www/rohnelt/docker-compose.yml` é um compose fantasma.** Ele
   duplica o `container_name` de um container vivo e ainda declara um nginx
   tomando as portas **80 e 443** do host. Um `docker compose up` nesse
   diretório **derruba todos os sites da VPS**. O compose real, em uso, é
   `/root/rohnelt`.
9. **O compose do warzil (`/opt/warzil/docker-compose.yml`) não declara
   `restart:`.** Os containers em execução estão `unless-stopped`, mas um
   `docker compose up -d` ali os recriaria com `restart=no`, e no próximo
   restart do daemon o warzil não voltaria sozinho. Se for mexer no compose,
   **acrescente `restart: unless-stopped` antes**.
10. **`/root/.pm2/dump.pm2` é compartilhado** entre os processos PM2 (hoje
    `chess2-server` e `chess2-web`). Nunca apague o arquivo. Para remover um
    processo: `pm2 delete <nome>` e depois `pm2 save`.
11. **Regras de `ufw` se removem por especificação** (`ufw delete allow
    3020/tcp`), **nunca por número** — os números se deslocam a cada remoção.
12. **nginx: `reload`, nunca `stop`.** E sempre `nginx -t` antes.

### Disco — leia com atenção, é onde mora o maior risco

13. **Filesystem único, 96 GB, ~23 GB livres, ZERO swap, ~250 MB de RAM
    livre.** No mesmo `/dev/sda1` vivem os 7 Postgres, os volumes Docker e o
    nginx. **Encher o disco derruba os 8 projetos de uma vez, e não é
    reversível de forma limpa** — Postgres entra em PANIC de escrita e deixa
    estado sujo.
14. **`/tmp` é tmpfs de 3,9 GB em RAM.** Escrever backup ali derruba o
    servidor por OOM.
15. Antes de qualquer operação que escreva volume (dump, `VACUUM FULL`,
    `pg_repack`, `CLUSTER`, cópia de tabela), **calcule o espaço necessário e
    confira o livre**. `VACUUM FULL` numa tabela de 12 GB precisa de ~12 GB
    livres, porque reescreve a tabela inteira antes de soltar a antiga.
16. **`VACUUM FULL` toma `ACCESS EXCLUSIVE LOCK`** — a tabela fica inacessível
    durante toda a operação. Numa tabela de 12 GB isso são muitos minutos com
    o warzil fora do ar. `pg_repack` faz o mesmo sem o lock longo, mas também
    precisa do espaço.

### Antes de qualquer destruição

17. **O warzil não tem backup nenhum.** Nem ele, nem tablegames, nem
    container-loader, nem chaveirogo. Só o quantical tem rotina; há dumps
    avulsos dos seis bancos pequenos em `/var/backups/vps-20260731-175927/`.
    **Não apague dado do warzil antes de existir backup do warzil.**
18. Para dumpar o warzil **sem gravar na VPS** (o jeito seguro, dado o
    espaço):
    ```bash
    ssh root@187.77.8.195 "docker exec warzil-postgres pg_dump -U warzil -d warzil -Fc -Z9 --no-owner" > warzil.dump
    ```
    Confira o resultado com `pg_restore -l warzil.dump` antes de confiar nele.
19. Nunca imprima senha. Elas estão nos `.env` de cada projeto e no
    `docker inspect`; ao citar, escreva `<omitido>`.

## Espaço já identificado como recuperável

Confirme os números antes de agir:

| | tamanho |
|---|---|
| `/root/.npm` (cache do npm) | **16 GB** |
| Build cache do Docker | **15,7 GB recuperáveis** de 18,5 GB |
| Imagens Docker | 5,7 GB, marcadas 100% recuperáveis |
| `/root/.local` (store do pnpm) | 843 MB |
| `/opt/warzil.backup-*` | **23 diretórios** de deploy por cópia |
| `/var/www/chess2/backups/before-*` | 2,1 GB de árvores de código |

Cache é cache: `npm cache clean --force` e `docker builder prune` custam
apenas o próximo download. **Recuperar isso é pré-requisito** para qualquer
operação pesada no warzil — é o que cria a folga para dumpar 17 GB e para
reescrever uma tabela de 12 GB.

Cuidado com o pnpm: ele liga `node_modules` ao store por **hardlink**, então
apagar um projeto não libera os blocos. Foi assim que apagar 823 MB liberou
267 MB.

## Roteiro

### Fase 1 — Só leitura. Não altere nada.

Sobre o warzil:

- Onde está o código? (`/opt/warzil`, sem git? confira) Que stack? Leia o
  schema e as migrations em `packages/db/migrations/`.
- **Ache o código que escreve em `match_snapshots` e `score_history`.** Essa é
  a peça central. Com que gatilho roda — cron, loop de jogo, webhook? Com que
  frequência? O que grava em cada coluna grande?
- Meça o inchaço, não só o tamanho:
  ```sql
  select relname, n_live_tup, n_dead_tup, last_autovacuum, last_autoanalyze,
         pg_size_pretty(pg_total_relation_size(relid)) as total,
         pg_size_pretty(pg_relation_size(relid))       as heap
  from pg_stat_user_tables order by pg_total_relation_size(relid) desc;
  ```
- Tamanho por coluna grande e o que há dentro:
  ```sql
  select pg_size_pretty(sum(pg_column_size(<coluna>))) from match_snapshots;
  select <coluna> from match_snapshots order by id desc limit 1;
  ```
- Distribuição temporal: quantas linhas por dia, e desde quando?
  `select date_trunc('day', <coluna_de_data>) d, count(*) from match_snapshots group by 1 order by 1;`
  Isso responde se o crescimento é linear, se acelerou, e se há dado antigo
  que ninguém consulta.
- Índices: algum é redundante ou nunca usado?
  `select * from pg_stat_user_indexes where idx_scan = 0;`
- Configuração de autovacuum da tabela e do servidor.
- Há particionamento? Retenção? Job de limpeza em cron ou no app?
- O app **consulta** dado antigo de `match_snapshots`, ou só grava? Procure no
  código os `select` sobre essa tabela. Se ninguém lê snapshot de 3 meses
  atrás, a resposta é retenção.

Sobre o resto do servidor:

- Inventário: containers, volumes, composes, vhosts nginx, processos PM2,
  certificados, cron, unidades systemd. O que está órfão de verdade?
- Que projetos não têm backup e qual o tamanho de cada banco?
- Que portas estão publicadas em `0.0.0.0` e quais têm vhost nginx que
  justifique.
- Os 23 `/opt/warzil.backup-*` e os `before-*` do chess2: dá para apagar? São
  cópias de código ou têm algo insubstituível?

### Fase 2 — Relatório, antes de mexer

Entregue, com evidência de comando:

1. **A causa do crescimento do warzil**, em uma frase, e o trecho de código
   que a produz.
2. Quanto dos 17 GB é dado vivo, quanto é histórico que ninguém lê, quanto é
   inchaço.
3. **A correção que faz parar de crescer** — a mudança de código ou de
   schema, não a limpeza.
4. O plano de limpeza, com espaço necessário, tempo estimado e janela de
   indisponibilidade de cada passo.
5. O que mais no servidor está desarrumado, em ordem de risco.

**Pare aqui e me mostre.** Não execute a Fase 3 sem eu aprovar.

### Fase 3 — Execução

Nesta ordem, e não em outra:

1. Recuperar o espaço fácil (caches). É o que cria margem para o resto.
2. Backup do warzil, transmitido para fora da VPS, validado com `pg_restore -l`.
3. A correção de código que estanca o crescimento — **antes** de limpar. Se
   limpar primeiro, a tabela volta a crescer enquanto você trabalha.
4. Só então a limpeza do histórico, em lotes com `commit` entre eles, nunca um
   `DELETE` de milhões de linhas numa transação só (ele infla o WAL e pode
   encher o disco — exatamente o que não pode acontecer).
5. Recuperar o espaço da tabela, escolhendo entre `VACUUM`, `pg_repack` ou
   recriação, conforme o espaço livre e a janela aceitável.
6. Backup automático diário para os projetos que não têm, com retenção e
   verificação de integridade.

Todo passo precisa de: comando exato, saída esperada e como desfazer. Marque
honestamente quais derrubam serviço e por quanto tempo.

## Ferramentas que já existem no servidor

- `/usr/local/sbin/verifica-invariantes.sh` — 12 invariantes de infraestrutura
  (perfil AppArmor, daemons, regras de firewall, bancos expostos). Roda por
  cron às 6h10 em `/var/log/vps-invariantes.log`. **Rode antes e depois de
  qualquer intervenção.**
- `/usr/local/sbin/render-docker-default.py` — re-renderiza e valida o perfil
  AppArmor. Use depois de todo refresh do snap docker.
- `/var/www/quantical-api/backup-db.sh` — modelo de rotina de backup que já
  funciona (dump, `.parcial` renomeado só quando completo, teste de
  integridade, retenção). Copie o padrão para os outros projetos.
- Snap com janela de manutenção em domingo 03:00–05:00. Um refresh do docker
  reinicia o daemon e os 17 containers; não mexa nisso sem motivo.

## Como quero a resposta

Direto e com evidência. Sem "provavelmente" — ou você mediu, ou escreve "não
apurado". Se encontrar algo que contradiga este prompt, **confie no servidor e
me avise**: este texto foi escrito em 31/07/2026 e o servidor muda.
