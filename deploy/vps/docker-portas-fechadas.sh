#!/usr/bin/env bash
# Fecha o acesso DIRETO da internet a portas de container.
#
# Existe porque o Docker escreve as proprias regras na cadeia DOCKER, avaliada
# ANTES do ufw: 'ufw deny 3001' nao tem efeito nenhum sobre uma porta publicada
# por container. A cadeia DOCKER-USER e o ponto de extensao oficial para isto.
#
# --ctorigdstport, e nao --dport: dentro da DOCKER-USER o pacote ja passou pelo
# DNAT, entao --dport seria a porta INTERNA do container (3000, 80, 5432) e nao
# a publicada.
#
# 5433 (postgres do dona-lia) entrou em 31/07/2026: teste externo confirmou que
# respondia da internet, com pg_hba 'host all all all' e senha trivial. O app da
# donalia fala com o banco pelo nome de servico da rede Docker (postgres:5432),
# nunca pela porta do host — fechar nao quebra nada. A porta so continua
# publicada porque o compose ainda a declara; ver 01-fecha-portas.sh.
#
# 3002 (app do dona-lia) NAO entra: hoje e o unico acesso a aplicacao, nao ha
# vhost nginx apontando para ela. Fechar deixaria o sistema inacessivel. O
# caminho certo e criar o vhost com TLS primeiro.
set -euo pipefail

PORTAS=(3001 8090 5433)

IFACE=$(ip route get 1.1.1.1 2>/dev/null | grep -oE 'dev [a-z0-9]+' | head -1 | cut -d' ' -f2)
IFACE=${IFACE:-eth0}

# O Docker recria a DOCKER-USER quando o daemon sobe. Se este script rodar no
# meio dessa subida, a cadeia pode ainda nao existir e o -I falharia — deixando
# as portas abertas com o servico reportando sucesso.
esperar_cadeia() {
  local cmd="$1"
  for _ in $(seq 1 30); do
    if "$cmd" -S DOCKER-USER >/dev/null 2>&1; then return 0; fi
    sleep 1
  done
  echo "$(date -Is) ERRO: cadeia DOCKER-USER nao apareceu em ${cmd} apos 30s" >&2
  return 1
}

aplicar() {
  local cmd="$1"
  esperar_cadeia "$cmd" || return 1
  for PORTA in "${PORTAS[@]}"; do
    "$cmd" -C DOCKER-USER -i "$IFACE" -p tcp -m conntrack --ctorigdstport "$PORTA" -j DROP 2>/dev/null \
      || "$cmd" -I DOCKER-USER -i "$IFACE" -p tcp -m conntrack --ctorigdstport "$PORTA" -j DROP
  done
}

aplicar iptables

# IPv6: hoje o Docker nao cria DNAT v6 nesta maquina, entao o trafego chega pelo
# docker-proxy em userland e cai no INPUT, onde o ufw6 (politica DROP) ja barra.
# A regra aqui fecha a deducao — se um dia o Docker ganhar DNAT v6, a protecao
# ja esta no lugar. Falha aqui nao derruba a protecao v4.
aplicar ip6tables || echo "$(date -Is) aviso: nao consegui aplicar as regras IPv6" >&2

echo "$(date -Is) portas fechadas na interface ${IFACE}: ${PORTAS[*]}"
