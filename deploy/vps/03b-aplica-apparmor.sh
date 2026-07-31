#!/usr/bin/env bash
# Aplica o perfil já validado por 03a-valida-apparmor.sh.
#
# O que muda em relação ao perfil de hoje (diff completo, nada além disto):
#   - 1 linha trocada: `signal (receive) peer=unconfined,` vira
#     `signal (receive) peer=snap.docker.dockerd,`. Não se perde nada: o
#     `peer=unconfined` continua presente algumas linhas acima — no perfil
#     atual essa linha era duplicata dele.
#   - 6 linhas acrescentadas: o bloco que autoriza o dockerd do snap a
#     sinalizar e rastrear os containers.
#
# Nenhuma regra `deny` é removida, nenhuma permissão é retirada. As travas do
# renderizador provam que o candidato é superconjunto estrito do perfil em
# vigor, então a troca não pode negar nada que hoje funciona.
#
# Zero downtime: `apparmor_parser -r` substitui o perfil atomicamente e as
# tarefas já confinadas migram para a nova versão sem reiniciar.
#
# Uso: ./deploy/vps/03b-aplica-apparmor.sh <dir-de-trabalho> [usuario@host]
#   ex: ./deploy/vps/03b-aplica-apparmor.sh /root/aa-20260731-141821
set -euo pipefail

TRABALHO="${1:?informe o diretório /root/aa-... gerado por 03a}"
ALVO="${2:-root@187.77.8.195}"

echo "==> Instalando e recarregando o perfil"
ssh "$ALVO" "install -m 0644 ${TRABALHO}/docker-default.candidate /etc/apparmor.d/docker-default && apparmor_parser -r /etc/apparmor.d/docker-default && echo recarregado"

echo
echo "==> Estado do perfil e dos containers"
ssh "$ALVO" "grep docker-default /sys/kernel/security/apparmor/profiles; docker ps -q | wc -l"

echo
echo "==> O teste que importa: parar e subir um container de verdade"
# quantical-api é a cobaia certa — é o container menos crítico do servidor: o
# site é estático e continua inteiro no ar sem a API (há teste e2e provando).
ssh "$ALVO" "docker stop quantical-api && docker start quantical-api && sleep 4 && docker ps -q | wc -l"

echo
echo "==> A API voltou?"
ssh "$ALVO" "curl -fsS --max-time 5 http://127.0.0.1:6002/api/saude"
echo

echo "==> Negações novas?"
ssh "$ALVO" "journalctl -k --since '3 min ago' | grep -c 'operation=\"signal\"' || echo 0"

echo
echo "Rollback (volta ao perfil de hoje, sem reiniciar nada):"
echo "  ssh ${ALVO} 'install -m 0644 ${TRABALHO}/docker-default.rollback /etc/apparmor.d/docker-default && apparmor_parser -r /etc/apparmor.d/docker-default'"
