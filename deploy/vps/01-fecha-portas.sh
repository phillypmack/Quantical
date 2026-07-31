#!/usr/bin/env bash
# Fecha o Postgres do dona-lia (5433) para a internet.
#
# POR QUE É URGENTE
# Teste externo confirmou que 187.77.8.195:5433 responde da internet. O
# pg_hba desse banco é `host all all all scram-sha-256` e a senha do
# superusuário segue o padrão trivial <usuario>123. O log do container mostra
# varreduras desde 19/06 (pacotes de startup malformados, protocolo inválido —
# assinatura de masscan/zgrab).
#
# POR QUE PELA DOCKER-USER, E NÃO PELO COMPOSE
# Fechar no compose exige RECRIAR o container, e recriar está bloqueado pelo
# defeito do AppArmor (ver 02-conserta-apparmor.sh). A regra de firewall fecha
# agora, sem tocar em container nenhum. O bind no compose vem depois, como
# defesa em profundidade.
#
# O QUE MAIS ESTE SCRIPT CORRIGE
# 1. O serviço existente é `Requires=docker.service` — o daemon do .deb, que
#    NÃO é quem serve os containers (quem serve é snap.docker.dockerd). Como o
#    docker.service vai ser mascarado, esse Requires faria o serviço FALHAR no
#    boot e as portas voltariam a abrir em silêncio.
# 2. O Docker LIMPA a cadeia DOCKER-USER toda vez que o daemon sobe. O serviço
#    é `oneshot` + `RemainAfterExit=yes` e não re-executa: hoje, um restart do
#    daemon reabre 3001 e 8090 para a internet sem nenhum aviso. `PartOf=`
#    corrige isso.
# 3. A cadeia DOCKER-USER do ip6tables está vazia. Pela análise de regras o
#    ufw6 já cobre o caminho v6 (não há DNAT v6), mas isso era dedução; a
#    regra explícita fecha a dedução.
#
# Idempotente: pode rodar quantas vezes quiser.
# Uso: ./deploy/vps/01-fecha-portas.sh [usuario@host]
set -euo pipefail

ALVO="${1:-root@187.77.8.195}"
CARIMBO="$(date +%Y%m%d-%H%M%S)"
LOCAL="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "==> Enviando o script novo"
scp -q "${LOCAL}/docker-portas-fechadas.sh" "${ALVO}:/tmp/dpf-${CARIMBO}.sh"
scp -q "${LOCAL}/docker-portas-fechadas.service" "${ALVO}:/tmp/dpf-${CARIMBO}.service"

echo "==> Aplicando no servidor"
ssh "$ALVO" bash -s -- "$CARIMBO" <<'REMOTO'
set -euo pipefail
CARIMBO="$1"

echo "--- guardando o estado anterior ---"
mkdir -p /root/rollback-${CARIMBO}
cp -a /usr/local/sbin/docker-portas-fechadas.sh /root/rollback-${CARIMBO}/ 2>/dev/null || true
cp -a /etc/systemd/system/docker-portas-fechadas.service /root/rollback-${CARIMBO}/ 2>/dev/null || true
iptables-save > /root/rollback-${CARIMBO}/iptables.rules
ip6tables-save > /root/rollback-${CARIMBO}/ip6tables.rules
echo "    /root/rollback-${CARIMBO}/"

echo "--- instalando script e unit ---"
install -m 0755 "/tmp/dpf-${CARIMBO}.sh" /usr/local/sbin/docker-portas-fechadas.sh
install -m 0644 "/tmp/dpf-${CARIMBO}.service" /etc/systemd/system/docker-portas-fechadas.service
rm -f "/tmp/dpf-${CARIMBO}.sh" "/tmp/dpf-${CARIMBO}.service"

systemctl daemon-reload
# `restart` num oneshot re-executa o ExecStart, que é o que aplica as regras.
systemctl restart docker-portas-fechadas.service
systemctl is-enabled docker-portas-fechadas.service

echo "--- DOCKER-USER (v4) ---"
iptables -S DOCKER-USER
echo "--- DOCKER-USER (v6) ---"
ip6tables -S DOCKER-USER

echo "--- containers seguem de pé? ---"
docker ps --format '{{.Names}}' | wc -l
REMOTO

echo "==> Conferindo de fora (o teste que importa)"
for PORTA in 5433 3001 8090; do
  if timeout 6 bash -c "cat < /dev/null > /dev/tcp/187.77.8.195/${PORTA}" 2>/dev/null; then
    echo "    ${PORTA}: AINDA ABERTA"
    FALHOU=1
  else
    echo "    ${PORTA}: fechada"
  fi
done
# A 3002 é o único acesso à donalia hoje (não há vhost nginx) — tem de continuar
# aberta, senão o app fica inacessível. Verificar é o que impede um "conserto"
# que derruba o serviço.
if timeout 6 bash -c "cat < /dev/null > /dev/tcp/187.77.8.195/3002" 2>/dev/null; then
  echo "    3002: aberta (esperado — é o único acesso ao app da donalia)"
else
  echo "    3002: FECHADA — o app da donalia ficou inacessível!"
  FALHOU=1
fi

if [ "${FALHOU:-0}" = "1" ]; then
  echo "==> FALHOU. Rollback: ssh ${ALVO} 'iptables-restore < /root/rollback-*/iptables.rules'"
  exit 1
fi
echo "==> Pronto"
