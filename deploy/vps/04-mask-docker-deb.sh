#!/usr/bin/env bash
# Elimina a corrida de boot entre os dois daemons Docker.
#
# RODE SÓ DEPOIS de 03b-aplica-apparmor.sh, com o perfil já corrigido.
#
# O QUE ESTÁ ERRADO
# Há dois dockerds ativos: o do pacote .deb (docker.service, 29.2.1) e o do
# snap (snap.docker.dockerd, 29.3.1). Quem serve os 17 containers de produção
# e detém os 43 GB de dados é o do SNAP:
#   docker info -> Docker Root Dir: /var/snap/docker/common/var-lib-docker
#   du -sh /var/lib/docker -> 244K   (o data root do .deb está vazio: um único
#                                     container parado desde fevereiro)
# O daemon do .deb não administra nada. Ele só faz mal: roda unconfined, ganha
# a corrida de boot e gera o docker-default errado — que é a causa raiz do
# `docker stop` quebrado.
#
# POR QUE MASCARAR E NÃO DESINSTALAR
# `systemctl mask` impede o serviço de subir nos próximos boots e NÃO para o
# processo que está rodando agora — ou seja, risco zero neste instante.
# Já parar o docker.service agora seria perigoso: /var/run é symlink para /run,
# os dois daemons disputaram o MESMO caminho de socket, e o socket que existe
# hoje (/run/docker.sock) é o do snap. Parar a docker.socket do systemd pode
# remover esse arquivo e deixar o CLI sem alcançar o daemon do snap — os
# containers continuariam rodando, mas ninguém conseguiria administrá-los.
# Não vale o risco: mascarar já resolve a corrida.
#
# `apt-get purge docker-ce` fica de fora de propósito: o purge PARA o serviço
# (mesmo risco acima) e o cliente `docker` do .deb é o que todo mundo usa na
# linha de comando. O snap traz /snap/bin/docker de reserva, mas trocar isso
# merece uma janela combinada, não um script.
#
# Uso: ./deploy/vps/04-mask-docker-deb.sh [usuario@host]
set -euo pipefail

ALVO="${1:-root@187.77.8.195}"

echo "==> Antes"
ssh "$ALVO" "systemctl is-enabled docker.service docker.socket snap.docker.dockerd; echo '---'; docker info --format 'Root={{.DockerRootDir}} Server={{.ServerVersion}} Containers={{.Containers}}'"

echo
echo "==> Mascarando o stack do .deb (não para nada que esteja rodando)"
ssh "$ALVO" "systemctl mask docker.service docker.socket"

echo
echo "==> Depois"
ssh "$ALVO" "systemctl is-enabled docker.service docker.socket snap.docker.dockerd || true; echo '---'; docker ps -q | wc -l; docker info --format 'Root={{.DockerRootDir}} Server={{.ServerVersion}}'"

echo
echo "==> O serviço que fecha as portas ainda sobe? (ele tinha Requires=docker.service)"
ssh "$ALVO" "systemctl status docker-portas-fechadas.service --no-pager -n 3 | head -6; iptables -S DOCKER-USER"

echo
echo "Desfazer:  ssh ${ALVO} 'systemctl unmask docker.service docker.socket'"
