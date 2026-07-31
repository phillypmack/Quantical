#!/usr/bin/env bash
# Sobe o Postgres e a API do Quantical na VPS.
#
# Segue o padrão que já roda no servidor: docker-compose por projeto em
# /var/www/<projeto>, banco preso a 127.0.0.1, nginx com proxy_pass. O site
# continua estático — se isto aqui cair, o Quantical inteiro continua de pé.
#
# Uso: ./scripts/deploy-api.sh [usuario@host]
set -euo pipefail

TARGET="${1:-root@187.77.8.195}"
REMOTE_DIR="/var/www/quantical-api"
LOCAL_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> Enviando os arquivos"
ssh "$TARGET" "mkdir -p ${REMOTE_DIR}"
scp -q \
  "$LOCAL_ROOT/deploy/api/docker-compose.yml" \
  "$LOCAL_ROOT/deploy/api/Dockerfile" \
  "$LOCAL_ROOT/deploy/api/package.json" \
  "$LOCAL_ROOT/deploy/api/server.mjs" \
  "$LOCAL_ROOT/deploy/api/schema.sql" \
  "$TARGET:${REMOTE_DIR}/"
scp -q "$LOCAL_ROOT/scripts/backup-db.sh" "$TARGET:${REMOTE_DIR}/backup-db.sh"

echo "==> Subindo os containers"
ssh "$TARGET" bash -s -- "$REMOTE_DIR" <<'REMOTE'
set -euo pipefail
DIR="$1"
cd "$DIR"

# A senha é gerada uma vez e fica no servidor. Nunca entra no repositório, e
# não é regravada em deploys seguintes — regravar quebraria o banco existente.
if [ ! -f .env ]; then
  SENHA="$(head -c 32 /dev/urandom | base64 | tr -d '/+=' | head -c 32)"
  cat > .env <<ENV
POSTGRES_USER=quantical
POSTGRES_PASSWORD=${SENHA}
POSTGRES_DB=quantical
ENV
  chmod 600 .env
  echo "    .env criado com senha nova"
else
  echo "    .env preservado"
fi

chmod 700 backup-db.sh

docker compose up -d --build
docker compose ps

# Espera o healthcheck antes de declarar vitória.
for _ in $(seq 1 30); do
  if curl -fsS --max-time 3 http://127.0.0.1:6002/api/saude >/dev/null 2>&1; then
    echo "    API respondendo"
    break
  fi
  sleep 2
done

# Backup diário às 3h20, fora da janela do certbot.
CRON="20 3 * * * ${DIR}/backup-db.sh >> /var/log/quantical-backup.log 2>&1"
if ! crontab -l 2>/dev/null | grep -qF "${DIR}/backup-db.sh"; then
  (crontab -l 2>/dev/null; echo "$CRON") | crontab -
  echo "    backup diário agendado"
else
  echo "    backup diário já estava agendado"
fi
REMOTE

echo "==> Conferindo de fora"
curl -fsS "https://quantical.com.br/api/saude" && echo
echo "==> Conferindo que o Postgres NÃO aceita conexão externa"
if timeout 5 bash -c "cat < /dev/null > /dev/tcp/187.77.8.195/5441" 2>/dev/null; then
  echo "FALHA: a porta 5441 está aberta para a internet"
  exit 1
fi
echo "    5441 fechada de fora, como tem de ser"
echo "==> Pronto"
