#!/usr/bin/env bash
# Prende o Postgres do dona-lia ao loopback, no compose.
#
# RODE SÓ DEPOIS de 03b-aplica-apparmor.sh: isto RECRIA um container, e recriar
# só volta a funcionar com o AppArmor corrigido.
#
# Isto é defesa em profundidade, não a correção principal — a porta já está
# fechada por regra de firewall desde 01-fecha-portas.sh, verificada de fora.
# O que muda aqui é que ela deixa de ser publicada, em vez de ser publicada e
# bloqueada. Se um dia a regra de firewall sumir, a porta não reabre.
#
# É SEGURO: o app da donalia fala com o banco pelo nome de serviço da rede
# Docker (`postgresql://donalia:...@postgres:5432/...`), nunca pela porta do
# host. Nada no servidor usa a 5433 — nenhum nginx, nenhum outro container.
#
# NÃO mexe na 3002 (o app): hoje ela é o ÚNICO acesso ao sistema, não há vhost
# nginx apontando para lá. Fechá-la deixaria a dona-lia inacessível. O caminho
# certo é criar antes um vhost com TLS.
#
# Uso: ./deploy/vps/05-donalia-loopback.sh [usuario@host]
set -euo pipefail

ALVO="${1:-root@187.77.8.195}"
CARIMBO="$(date +%Y%m%d-%H%M%S)"

ssh "$ALVO" bash -s -- "$CARIMBO" <<'REMOTO'
set -euo pipefail
CARIMBO="$1"
DIR=/var/www/dona-lia-estoque

cp -a "${DIR}/docker-compose.yml" "/root/donalia-compose.bak-${CARIMBO}"

echo "--- antes ---"
grep -n -A2 'ports:' "${DIR}/docker-compose.yml"

# Só a linha do banco. A do app ("3002:3000") fica como está, de propósito.
sed -i 's|^\(\s*\)- "5433:5432"|\1- "127.0.0.1:5433:5432"|' "${DIR}/docker-compose.yml"

echo "--- depois ---"
grep -n -A2 'ports:' "${DIR}/docker-compose.yml"

grep -q '"127.0.0.1:5433:5432"' "${DIR}/docker-compose.yml" || {
  echo "o sed não pegou — restaurando" >&2
  cp -a "/root/donalia-compose.bak-${CARIMBO}" "${DIR}/docker-compose.yml"
  exit 1
}

echo "--- recriando só o postgres ---"
cd "$DIR"
docker compose up -d --no-deps postgres

sleep 6
docker ps --format '{{.Names}}\t{{.Ports}}' | grep donalia

echo "--- o app ainda enxerga o banco? ---"
docker exec donalia-postgres pg_isready -U donalia -d dona_lia_estoque
docker logs donalia-app --tail 5 2>&1 | tail -5
REMOTO

echo
echo "==> Conferindo de fora"
if timeout 6 bash -c "cat < /dev/null > /dev/tcp/187.77.8.195/5433" 2>/dev/null; then
  echo "    5433 AINDA ABERTA"
  exit 1
fi
echo "    5433 fechada"
if timeout 6 bash -c "cat < /dev/null > /dev/tcp/187.77.8.195/3002" 2>/dev/null; then
  echo "    3002 aberta (esperado — único acesso ao app)"
else
  echo "    3002 fechada — o app da donalia ficou inacessível!"
  exit 1
fi

echo "Desfazer: ssh ${ALVO} 'cp /root/donalia-compose.bak-${CARIMBO} /var/www/dona-lia-estoque/docker-compose.yml && cd /var/www/dona-lia-estoque && docker compose up -d --no-deps postgres'"
