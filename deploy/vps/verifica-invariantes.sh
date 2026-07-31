#!/usr/bin/env bash
# Confere os invariantes que a intervenção de 31/07/2026 estabeleceu.
#
# Roda diário pelo cron e também à mão. Sai 0 se está tudo certo, 1 se algo
# regrediu — e a saída diz exatamente o quê.
#
# O invariante mais escorregadio é o do perfil AppArmor: /etc/apparmor.d/
# docker-default é um render CONGELADO do template do dockerd 29.3.1. Se o snap
# atualizar e o template mudar, o perfil no disco fica defasado em silêncio.
# Por isso a verificação re-renderiza a partir do binário atual e compara.
set -uo pipefail

FALHAS=0
falha() { echo "FALHA: $*"; FALHAS=1; }
ok() { echo "ok: $*"; }

# ---------------------------------------------------------------- AppArmor
if [ -f /etc/apparmor.d/docker-default ]; then
  ok "perfil docker-default existe em disco"
else
  falha "/etc/apparmor.d/docker-default sumiu — o dockerd volta a gerar o perfil errado no boot"
fi

if grep -q 'docker-default (enforce)' /sys/kernel/security/apparmor/profiles 2>/dev/null; then
  ok "docker-default carregado em enforce"
else
  falha "docker-default não está em enforce (complain é paliativo, não estado estável)"
fi

if grep -q 'peer="snap.docker.dockerd"' /etc/apparmor.d/docker-default 2>/dev/null; then
  ok "regra de sinal do daemon do snap presente"
else
  falha "a regra signal peer=snap.docker.dockerd sumiu — docker stop vai voltar a falhar"
fi

# O sinal de defasagem depois de um refresh do snap.
if [ -x /usr/local/sbin/render-docker-default.py ]; then
  TMP=$(mktemp -d)
  if /usr/local/sbin/render-docker-default.py \
       /snap/docker/current/bin/dockerd /usr/bin/dockerd "$TMP" >/dev/null 2>&1; then
    if diff -q "$TMP/docker-default.candidate" /etc/apparmor.d/docker-default >/dev/null 2>&1; then
      ok "perfil em disco bate com o template do dockerd instalado"
    else
      falha "o template do dockerd MUDOU (refresh do snap?) e o perfil em disco ficou defasado — rode deploy/vps/03a e 03b de novo"
    fi
  else
    falha "o renderizador não conseguiu validar o template atual — rode deploy/vps/03a para ver o motivo"
  fi
  rm -rf "$TMP"
else
  echo "aviso: /usr/local/sbin/render-docker-default.py não instalado; sem checagem de defasagem"
fi

# A janela começa quando o perfil corrigido foi instalado, não "24h atrás":
# as negações anteriores ao conserto são história, e contá-las faria a
# verificação nascer vermelha e ensinar todo mundo a ignorá-la.
DESDE=$(stat -c '%y' /etc/apparmor.d/docker-default 2>/dev/null | cut -d. -f1)
DESDE=${DESDE:-24 hours ago}
NEGACOES=$(journalctl -k --since "$DESDE" 2>/dev/null | grep -c 'operation="signal".*docker-default' || true)
if [ "${NEGACOES:-0}" -eq 0 ]; then
  ok "nenhuma negação de sinal desde que o perfil foi corrigido (${DESDE})"
else
  falha "${NEGACOES} negações de sinal desde ${DESDE}"
fi

# ------------------------------------------------------------------ Daemons
for UNIT in docker.service docker.socket; do
  if [ "$(systemctl is-enabled "$UNIT" 2>/dev/null)" = "masked" ]; then
    ok "${UNIT} mascarado"
  else
    falha "${UNIT} deixou de estar mascarado — o daemon do .deb volta a disputar o boot e a gerar o perfil errado"
  fi
done

if systemctl is-active --quiet snap.docker.dockerd; then
  ok "snap.docker.dockerd ativo (é ele quem serve os containers)"
else
  falha "snap.docker.dockerd não está ativo"
fi

# -------------------------------------------------------------------- Portas
for PORTA in 3001 8090 5433; do
  if iptables -C DOCKER-USER -i eth0 -p tcp -m conntrack --ctorigdstport "$PORTA" -j DROP 2>/dev/null; then
    ok "DOCKER-USER bloqueia ${PORTA}"
  else
    falha "a regra de DROP da porta ${PORTA} sumiu (o Docker limpa a cadeia quando o daemon sobe)"
  fi
done

# Nenhum banco pode publicar em todas as interfaces.
EXPOSTOS=$(docker ps --format '{{.Names}} {{.Ports}}' 2>/dev/null \
  | grep '0\.0\.0\.0' | grep -iE 'postgres|mysql|redis|mongo' || true)
if [ -z "$EXPOSTOS" ]; then
  ok "nenhum banco publicado em 0.0.0.0"
else
  falha "banco exposto: ${EXPOSTOS}"
fi

echo
if [ "$FALHAS" = "0" ]; then
  echo "$(date -Is) todos os invariantes OK"
else
  echo "$(date -Is) HÁ REGRESSÃO — ver acima" >&2
fi
exit "$FALHAS"
