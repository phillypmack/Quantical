#!/usr/bin/env bash
# Backup dos bancos da VPS antes de mexer no AppArmor.
#
# CONTEXTO: dos 8 projetos deste servidor, só o quantical tinha backup — e o
# cron dele nunca chegou a rodar. warzil, tablegames, donalia, container-loader,
# chaveirogo e baseline-tennis não tinham nenhuma cópia.
#
# POR QUE O WARZIL FICA DE FORA POR PADRÃO
# Ele tem 17 GB (99,6% de todos os dados do servidor); os outros seis somados
# dão ~65 MB. O disco é um filesystem único com 23 GB livres, sem swap e com
# ~250 MB de RAM livre. Escrever um dump de vários GB ali, com 7 Postgres
# ativos no mesmo disco, é a operação mais perigosa deste servidor — e ela não
# é pré-requisito de nada que estes scripts fazem (nenhum recria container do
# warzil, nenhum reinicia o daemon).
#
# Para incluí-lo mesmo assim: ./02-backup-bancos.sh usuario@host --com-warzil
# O script aborta sozinho se o espaço livre cair abaixo de MINIMO_LIVRE_GB.
#
# Uso: ./deploy/vps/02-backup-bancos.sh [usuario@host] [--com-warzil]
set -euo pipefail

ALVO="${1:-root@187.77.8.195}"
COM_WARZIL="${2:-}"

ssh "$ALVO" bash -s -- "$COM_WARZIL" <<'REMOTO'
set -euo pipefail
COM_WARZIL="${1:-}"
MINIMO_LIVRE_GB=8
DESTINO="/var/backups/vps-$(date +%Y%m%d-%H%M%S)"

mkdir -p "$DESTINO"
chmod 700 "$DESTINO"

livre_gb() { df --output=avail -BG / | tail -1 | tr -dc '0-9'; }

echo "--- espaço livre antes: $(livre_gb) GB ---"

# container:usuario:banco — lido do ambiente de cada container no recon.
BANCOS="
quantical-postgres:quantical:quantical
chess2-postgres:chess2:chess2
tablegames-postgres:tablegames:tablegames
donalia-postgres:donalia:dona_lia_estoque
container-loader-db:container_user:container_loader
chaveirogo-postgres:chaveiro:chaveirogo
"

if [ "$COM_WARZIL" = "--com-warzil" ]; then
  BANCOS="${BANCOS}
warzil-postgres:warzil:warzil"
fi

FALHAS=0
for LINHA in $BANCOS; do
  CONTAINER="${LINHA%%:*}"
  RESTO="${LINHA#*:}"
  USUARIO="${RESTO%%:*}"
  BANCO="${RESTO#*:}"

  if [ "$(livre_gb)" -lt "$MINIMO_LIVRE_GB" ]; then
    echo "ABORTANDO: espaço livre caiu para $(livre_gb) GB" >&2
    FALHAS=1
    break
  fi

  if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
    echo "    ${CONTAINER}: container não está de pé — pulando"
    continue
  fi

  ARQUIVO="${DESTINO}/${BANCO}.dump"
  # -Fc: formato custom, comprimido e restaurável seletivamente com pg_restore.
  # Escreve como .parcial e só renomeia depois de completo — um dump truncado
  # com nome definitivo é pior que backup nenhum, porque parece que existe.
  if docker exec "$CONTAINER" pg_dump -U "$USUARIO" -d "$BANCO" -Fc -Z6 --no-owner > "${ARQUIVO}.parcial" 2>"${ARQUIVO}.log"; then
    mv "${ARQUIVO}.parcial" "$ARQUIVO"
    # pg_restore -l só lê o índice do arquivo: se ele estiver truncado ou
    # corrompido, falha aqui em vez de falhar no dia da restauração.
    if docker exec -i "$CONTAINER" pg_restore -l < "$ARQUIVO" > "${ARQUIVO}.indice" 2>/dev/null; then
      ITENS=$(wc -l < "${ARQUIVO}.indice")
      echo "    ${BANCO}: $(du -h "$ARQUIVO" | cut -f1), ${ITENS} objetos, índice OK"
      rm -f "${ARQUIVO}.log" "${ARQUIVO}.indice"
    else
      echo "    ${BANCO}: FALHA — o dump não passa no pg_restore -l" >&2
      FALHAS=1
    fi
  else
    echo "    ${BANCO}: FALHA no pg_dump — $(tail -1 "${ARQUIVO}.log" 2>/dev/null)" >&2
    rm -f "${ARQUIVO}.parcial"
    FALHAS=1
  fi
done

chmod 600 "$DESTINO"/*.dump 2>/dev/null || true
echo "--- espaço livre depois: $(livre_gb) GB ---"
echo "--- conteúdo de ${DESTINO} ---"
ls -lh "$DESTINO"

if [ "$FALHAS" = "1" ]; then
  echo "HOUVE FALHA — não prossiga para o conserto do AppArmor" >&2
  exit 1
fi
echo "Backup completo em ${DESTINO}"
REMOTO
