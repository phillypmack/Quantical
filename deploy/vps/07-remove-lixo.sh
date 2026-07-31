#!/usr/bin/env bash
# Remove dois projetos abandonados da VPS: mobiterminal e tablegames.
#
# O dono confirmou que são lixo dele e autorizou a remoção.
#
# O QUE ESTAVA ACONTECENDO
#   mobi.rohnelt.dev        -> 502 (o app responde 502 no próprio 127.0.0.1:8787)
#   tablegames.rohnelt.dev  -> não resolve em DNS, e o vhost nem tem bloco 443
#
# BACKUP ANTES DE APAGAR, mesmo sendo lixo. Nenhum dos dois tem repositório
# git — `/opt/tablegames` é a ÚNICA cópia daquele código. 823 MB viram ~33 MB
# sem o node_modules, então guardar é barato e apagar é definitivo.
#
# O QUE NÃO PODE SER TOCADO (apurado no mapeamento):
#   - /root/.pm2/dump.pm2 é COMPARTILHADO: traz também chess2-server e
#     chess2-web, que sustentam o xadrez.pro. O caminho certo é `pm2 delete`
#     dos três processos e depois `pm2 save`, que reescreve o arquivo com os
#     dois que ficam. Apagar o arquivo mataria a ressurreição do chess2 no boot.
#   - a imagem `postgres:16-alpine` é usada por 5 containers.
#   - a rede `bridge` é a padrão do Docker e hospeda também o chess2-postgres.
#   - /etc/letsencrypt/options-ssl-nginx.conf e ssl-dhparams.pem são includes
#     globais do certbot, usados por 10 vhosts.
#   - o certificado de mobi.rohnelt.dev cobre UM domínio só (verificado), então
#     removê-lo não derruba outro site. O de rohnelt.dev cobre 2 e fica.
#   - nginx: `reload`, nunca `stop`.
#
# Uso: ./deploy/vps/07-remove-lixo.sh [usuario@host]
set -euo pipefail

ALVO="${1:-root@187.77.8.195}"
CARIMBO="$(date +%Y%m%d-%H%M%S)"

echo "==> FASE 1: backup (nada é removido ainda)"
ssh "$ALVO" bash -s -- "$CARIMBO" <<'REMOTO'
set -euo pipefail
CARIMBO="$1"
GUARDA="/root/removidos-${CARIMBO}"
mkdir -p "$GUARDA"

# Código, sem node_modules: 823 MB viram dezenas.
tar -czf "${GUARDA}/tablegames-codigo.tar.gz" \
  --exclude=node_modules --exclude=.next --exclude=.turbo \
  -C /opt tablegames
tar -czf "${GUARDA}/mobiterminal-relay.tar.gz" -C /var/www mobiterminal-relay

# Banco do tablegames, dump fresco (já havia um de hoje de manhã).
docker exec tablegames-postgres pg_dump -U tablegames -d tablegames -Fc -Z6 --no-owner \
  > "${GUARDA}/tablegames.dump"
docker exec -i tablegames-postgres pg_restore -l < "${GUARDA}/tablegames.dump" > /dev/null \
  && echo "    dump do tablegames válido"

# Config: vhosts, entradas do pm2 e a receita do container feito à mão.
cp -a /etc/nginx/sites-available/tablegames.rohnelt.dev "${GUARDA}/" 2>/dev/null || true
cp -a /etc/nginx/sites-available/mobiterminal.conf "${GUARDA}/" 2>/dev/null || true
cp -a /root/.pm2/dump.pm2 "${GUARDA}/dump.pm2.antes"
pm2 jlist > "${GUARDA}/pm2-jlist.antes.json" 2>/dev/null || true
docker inspect tablegames-postgres > "${GUARDA}/tablegames-postgres.inspect.json"
ufw status numbered > "${GUARDA}/ufw.antes.txt"
docker volume inspect tablegames-pgdata > "${GUARDA}/tablegames-pgdata.inspect.json"

chmod -R 600 "${GUARDA}"/* 2>/dev/null || true
echo "--- guardado em ${GUARDA} ---"
ls -lh "$GUARDA"
REMOTO

echo
echo "==> FASE 2: nginx — parar de rotear (reload, nunca stop)"
ssh "$ALVO" bash -s <<'REMOTO'
set -euo pipefail
rm -f /etc/nginx/sites-enabled/tablegames.rohnelt.dev /etc/nginx/sites-enabled/mobiterminal.conf
rm -f /etc/nginx/sites-available/tablegames.rohnelt.dev /etc/nginx/sites-available/mobiterminal.conf
nginx -t
systemctl reload nginx
echo "vhosts restantes:"
ls /etc/nginx/sites-enabled/
REMOTO

echo
echo "==> FASE 3: PM2 — só os três, preservando o chess2"
ssh "$ALVO" bash -s <<'REMOTO'
set -euo pipefail
pm2 delete mobiterminal-relay tablegames-web tablegames-game
# `pm2 save` reescreve o dump com o que sobrou. Sem isto, o boot ressuscitaria
# os três de volta.
pm2 save
echo "--- processos restantes ---"
pm2 list
echo "--- dump.pm2 agora ---"
python3 -c "import json;print([p['name'] for p in json.load(open('/root/.pm2/dump.pm2'))])"
rm -f /root/.pm2/logs/tablegames-*.log /root/.pm2/logs/mobiterminal-relay-*.log
rm -f /root/.pm2/pids/tablegames-*.pid /root/.pm2/pids/mobiterminal-relay-*.pid
REMOTO

echo
echo "==> FASE 4: Docker — container e volume do tablegames (a imagem FICA)"
ssh "$ALVO" bash -s <<'REMOTO'
set -euo pipefail
docker stop tablegames-postgres
docker rm tablegames-postgres
docker volume rm tablegames-pgdata
echo "--- chess2-postgres continua de pé? ---"
docker ps --format '{{.Names}}' | grep -x chess2-postgres
echo "--- a imagem compartilhada continua? ---"
docker images postgres:16-alpine --format '{{.Repository}}:{{.Tag}}'
echo "--- total de containers ---"
docker ps -q | wc -l
REMOTO

echo
echo "==> FASE 5: certificado do mobi (cobre 1 domínio só)"
ssh "$ALVO" "certbot delete --cert-name mobi.rohnelt.dev --non-interactive && certbot certificates 2>/dev/null | grep 'Certificate Name'"

echo
echo "==> FASE 6: firewall — por especificação, nunca por número"
# Remover por número é armadilha: os números se deslocam a cada remoção.
ssh "$ALVO" bash -s <<'REMOTO'
set -euo pipefail
ufw --force delete allow 3020/tcp || true
ufw --force delete allow 3021/tcp || true
ufw status numbered
REMOTO

echo
echo "==> FASE 7: diretórios"
ssh "$ALVO" bash -s <<'REMOTO'
set -euo pipefail
ANTES=$(df --output=avail -BM / | tail -1 | tr -dc '0-9')
rm -rf /opt/tablegames /var/www/mobiterminal-relay
DEPOIS=$(df --output=avail -BM / | tail -1 | tr -dc '0-9')
echo "espaço liberado: $(( DEPOIS - ANTES )) MB"
df -h /
REMOTO

echo
echo "==> FASE 8: verificação"
ssh "$ALVO" "/usr/local/sbin/verifica-invariantes.sh"
