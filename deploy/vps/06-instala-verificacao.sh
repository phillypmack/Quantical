#!/usr/bin/env bash
# Instala a verificação diária dos invariantes e dá ao snap uma janela de
# manutenção previsível.
#
# POR QUE A JANELA DO SNAP IMPORTA
# O timer padrão é `00:00~24:00/4` — quatro refreshes por dia, a qualquer hora.
# Um refresh do snap docker REINICIA o daemon, e com ele os 17 containers dos 8
# projetos. Numa terça às 14h isso é uma queda de produção sem ninguém olhando.
# Domingo de madrugada é bem diferente. (Os containers voltam sozinhos —
# todos têm restart=unless-stopped —, mas a queda existe.)
#
# E há o efeito colateral silencioso: depois de um refresh, o template do
# dockerd pode mudar e o perfil congelado em /etc/apparmor.d/docker-default
# fica defasado. A verificação diária detecta isso.
#
# Uso: ./deploy/vps/06-instala-verificacao.sh [usuario@host]
set -euo pipefail

ALVO="${1:-root@187.77.8.195}"
LOCAL="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "==> Enviando"
scp -q "${LOCAL}/verifica-invariantes.sh" "${ALVO}:/tmp/verifica-invariantes.sh"
scp -q "${LOCAL}/render-docker-default.py" "${ALVO}:/tmp/render-docker-default.py"

echo "==> Instalando"
ssh "$ALVO" "install -m 0755 /tmp/verifica-invariantes.sh /usr/local/sbin/verifica-invariantes.sh && install -m 0755 /tmp/render-docker-default.py /usr/local/sbin/render-docker-default.py && rm -f /tmp/verifica-invariantes.sh /tmp/render-docker-default.py && echo instalados"

echo "==> Janela de manutenção do snap (domingo 03:00-05:00)"
ssh "$ALVO" "snap set system refresh.timer=sun,03:00-05:00 && snap refresh --time"

echo "==> Cron diário às 6h10"
ssh "$ALVO" "(crontab -l 2>/dev/null | grep -v verifica-invariantes; echo '10 6 * * * /usr/local/sbin/verifica-invariantes.sh >> /var/log/vps-invariantes.log 2>&1') | crontab - && crontab -l"

echo
echo "==> Rodando a verificação agora"
ssh "$ALVO" "/usr/local/sbin/verifica-invariantes.sh"
