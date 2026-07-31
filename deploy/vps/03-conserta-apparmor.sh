#!/usr/bin/env bash
# Conserta o AppArmor: devolve ao servidor a capacidade de parar containers.
#
# SINTOMA
#   docker stop <qualquer container>  ->  "permission denied"
#   dmesg: apparmor="DENIED" operation="signal" profile="docker-default"
#          denied_mask="receive" signal=kill peer="snap.docker.dockerd"
#   181 negações nos últimos 7 dias.
#
# CAUSA (provada no reconhecimento)
#   `docker-default` não tem arquivo no disco — o dockerd o gera de um template
#   embutido no binário. Há DOIS dockerds nesta máquina: o do .deb (unconfined)
#   e o do snap (confinado, e dono de todos os 17 containers). O do .deb ganhou
#   a corrida de boot e carregou o perfil primeiro; como o dockerd faz
#   early-return quando o perfil já existe, o do snap nunca o corrigiu. Por
#   isso o perfil em kernel diz `signal (receive) peer=unconfined` onde deveria
#   dizer `peer=snap.docker.dockerd`.
#
# CONSERTO
#   Materializar o perfil em /etc/apparmor.d/docker-default, renderizado do
#   template do binário do SNAP. Zero downtime: a troca de perfil no AppArmor é
#   atômica e as tarefas confinadas migram sem reinício. E persiste: o
#   apparmor.service carrega /etc/apparmor.d ~34 s antes de qualquer dockerd,
#   então nos próximos boots os DOIS daemons caem no early-return.
#
# Uso: ./deploy/vps/03-conserta-apparmor.sh [usuario@host]
set -euo pipefail

ALVO="${1:-root@187.77.8.195}"
CARIMBO="$(date +%Y%m%d-%H%M%S)"
LOCAL="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "==> Enviando o renderizador"
scp -q "${LOCAL}/render-docker-default.py" "${ALVO}:/tmp/render-${CARIMBO}.py"

echo "==> Renderizando e validando (ainda sem carregar nada)"
ssh "$ALVO" bash -s -- "$CARIMBO" <<'REMOTO'
set -euo pipefail
CARIMBO="$1"
TRABALHO="/root/aa-${CARIMBO}"
mkdir -p "$TRABALHO"

python3 "/tmp/render-${CARIMBO}.py" \
  /snap/docker/current/bin/dockerd \
  /usr/bin/dockerd \
  "$TRABALHO"

echo
echo "--- as 9 linhas peer= do candidato ---"
grep -n 'peer=' "${TRABALHO}/docker-default.candidate"

echo
echo "--- parse a seco, sem carregar (apparmor_parser -Q) ---"
# -Q compila e descarta. Se o arquivo tiver erro de sintaxe, falha AQUI, com o
# perfil antigo intacto em kernel.
apparmor_parser -Q "${TRABALHO}/docker-default.candidate" && echo "parse OK"

echo
echo "--- estado ANTES ---"
grep 'docker-default' /sys/kernel/security/apparmor/profiles
echo "containers de pé: $(docker ps -q | wc -l)"
echo "negações de sinal nos últimos 7 dias: $(journalctl -k --since '7 days ago' | grep -c 'operation=\"signal\"' || true)"
REMOTO

echo
echo "==> Carregando o perfil corrigido"
ssh "$ALVO" bash -s -- "$CARIMBO" <<'REMOTO'
set -euo pipefail
CARIMBO="$1"
TRABALHO="/root/aa-${CARIMBO}"

install -m 0644 "${TRABALHO}/docker-default.candidate" /etc/apparmor.d/docker-default
# -r substitui o perfil de mesmo nome, atomicamente. Nenhum processo reinicia.
apparmor_parser -r /etc/apparmor.d/docker-default
echo "perfil recarregado"

echo "--- estado DEPOIS ---"
grep 'docker-default' /sys/kernel/security/apparmor/profiles
echo "containers de pé: $(docker ps -q | wc -l)"
rm -f "/tmp/render-${CARIMBO}.py"
REMOTO

echo
echo "==> O teste que importa: parar e subir um container de verdade"
ssh "$ALVO" bash -s <<'REMOTO'
set -euo pipefail
# quantical-api é a cobaia certa: é o container menos crítico do servidor — o
# site é estático e continua inteiro no ar sem a API (há teste e2e provando).
ANTES=$(docker ps -q | wc -l)

echo "--- docker stop quantical-api ---"
if docker stop quantical-api; then
  echo "PAROU (era exatamente isto que estava quebrado)"
else
  echo "AINDA FALHA — rollback abaixo" >&2
  exit 1
fi

echo "--- docker start quantical-api ---"
docker start quantical-api
sleep 4

DEPOIS=$(docker ps -q | wc -l)
echo "containers antes=${ANTES} depois=${DEPOIS}"
[ "$ANTES" = "$DEPOIS" ] || { echo "algum container não voltou!" >&2; exit 1; }

echo "--- a API responde? ---"
curl -fsS --max-time 5 http://127.0.0.1:6002/api/saude && echo

echo "--- negações novas depois do conserto? ---"
journalctl -k --since '2 min ago' | grep 'operation="signal"' | tail -5 || echo "nenhuma"
REMOTO

echo
echo "==> Conferindo o site de fora"
curl -fsS --max-time 10 https://quantical.com.br/api/saude && echo
echo "==> Pronto"
echo
echo "Rollback, se algo aparecer depois:"
echo "  ssh ${ALVO} 'install -m 0644 /root/aa-${CARIMBO}/docker-default.rollback /etc/apparmor.d/docker-default && apparmor_parser -r /etc/apparmor.d/docker-default'"
echo "Alívio imediato, sem descarregar nada:"
echo "  ssh ${ALVO} 'apparmor_parser -r -C /etc/apparmor.d/docker-default'   # carrega em complain"
