#!/usr/bin/env bash
# Só valida: renderiza o perfil candidato e prova que ele é seguro.
# NÃO instala nada, NÃO carrega nada no kernel, NÃO toca em container.
#
# A aplicação em si está em 03b-aplica-apparmor.sh, separada de propósito:
# esta parte pode rodar quantas vezes quiser, a qualquer hora, sem risco.
#
# Uso: ./deploy/vps/03a-valida-apparmor.sh [usuario@host]
set -euo pipefail

ALVO="${1:-root@187.77.8.195}"
CARIMBO="$(date +%Y%m%d-%H%M%S)"
LOCAL="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

scp -q "${LOCAL}/render-docker-default.py" "${ALVO}:/tmp/render-${CARIMBO}.py"

ssh "$ALVO" "mkdir -p /root/aa-${CARIMBO} && python3 /tmp/render-${CARIMBO}.py /snap/docker/current/bin/dockerd /usr/bin/dockerd /root/aa-${CARIMBO}"

echo
echo "--- linhas peer= do candidato ---"
ssh "$ALVO" "grep -n 'peer=' /root/aa-${CARIMBO}/docker-default.candidate"

echo
echo "--- parse a seco (compila e descarta, não carrega) ---"
ssh "$ALVO" "apparmor_parser -Q /root/aa-${CARIMBO}/docker-default.candidate && echo 'parse OK'"

echo
echo "--- diff entre o perfil de hoje e o candidato ---"
ssh "$ALVO" "diff /root/aa-${CARIMBO}/docker-default.rollback /root/aa-${CARIMBO}/docker-default.candidate || true"

echo
echo "Validado. Nada foi alterado no servidor."
echo "Diretório de trabalho: /root/aa-${CARIMBO}"
