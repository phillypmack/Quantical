#!/usr/bin/env bash
# Backup diário do Postgres do Quantical.
#
# Este servidor não tinha backup automático de banco nenhum — o cron só tinha
# certbot, prune de imagens, e2scrub e sysstat. Guardar dados de aprendizado
# sem backup é assumir a perda deles.
#
# Roda no servidor, chamado pelo cron instalado por scripts/deploy-api.sh.
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DESTINO="/var/backups/quantical"
RETENCAO_DIAS=14
CARIMBO="$(date +%Y%m%d-%H%M%S)"
ARQUIVO="${DESTINO}/quantical-${CARIMBO}.sql.gz"

mkdir -p "$DESTINO"
chmod 700 "$DESTINO"

# shellcheck disable=SC1091
set -a; . "${DIR}/.env"; set +a

# --clean --if-exists deixa o dump restaurável sobre um banco já existente,
# que é o cenário real de uma restauração às pressas.
docker exec quantical-postgres pg_dump \
  --username "$POSTGRES_USER" \
  --dbname "$POSTGRES_DB" \
  --clean --if-exists --no-owner \
  | gzip -9 > "${ARQUIVO}.parcial"

# Só vira backup de verdade depois de completo: um .sql.gz truncado com nome
# definitivo é pior que backup nenhum, porque parece que existe.
mv "${ARQUIVO}.parcial" "$ARQUIVO"
chmod 600 "$ARQUIVO"

# Um dump que não descompacta não é backup. Conferir custa segundos.
if ! gzip -t "$ARQUIVO"; then
  echo "$(date -Is) FALHA: ${ARQUIVO} não passa no teste de integridade" >&2
  rm -f "$ARQUIVO"
  exit 1
fi

TAMANHO="$(du -h "$ARQUIVO" | cut -f1)"
echo "$(date -Is) ok ${ARQUIVO} (${TAMANHO})"

# Retenção. -mtime +N apaga o que passou de N dias.
find "$DESTINO" -name 'quantical-*.sql.gz' -mtime "+${RETENCAO_DIAS}" -delete
find "$DESTINO" -name '*.parcial' -mtime +1 -delete
