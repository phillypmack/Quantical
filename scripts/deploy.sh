#!/usr/bin/env bash
# Publica a Quantical na VPS.
#
# Troca o conteúdo de forma atômica: sobe para um diretório novo e só então
# move o antigo para trás. Se algo falhar no meio, o site que está no ar não
# é afetado.
#
# Uso: ./scripts/deploy.sh [usuario@host]
set -euo pipefail

TARGET="${1:-root@187.77.8.195}"
DOMAIN="quantical.com.br"
ROOT="/var/www/quantical"
STAMP="$(date +%Y%m%d-%H%M%S)"
LOCAL_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> Build de produção"
cd "$LOCAL_ROOT"
NEXT_PUBLIC_SITE_URL="https://${DOMAIN}" npm run build

echo "==> Conferindo o artefato"
test -f out/index.html || { echo "out/index.html não existe"; exit 1; }
test -f out/sitemap.xml || { echo "sitemap.xml não foi gerado"; exit 1; }
test -f out/aprender.html || { echo "aprender.html não foi gerado"; exit 1; }

echo "==> Empacotando"
TARBALL="$(mktemp -t quantical-XXXXXX).tar.gz"
tar -czf "$TARBALL" -C out .
echo "    $(du -h "$TARBALL" | cut -f1)"

echo "==> Enviando"
scp -q "$TARBALL" "$TARGET:/tmp/quantical-${STAMP}.tar.gz"
scp -q deploy/quantical-headers.conf "$TARGET:/tmp/quantical-headers-${STAMP}.conf"
scp -q deploy/nginx.quantical.conf "$TARGET:/tmp/quantical-nginx-${STAMP}.conf"
rm -f "$TARBALL"

echo "==> Instalando no servidor"
ssh "$TARGET" bash -s -- "$STAMP" "$ROOT" "$DOMAIN" <<'REMOTE'
set -euo pipefail
STAMP="$1"; ROOT="$2"; DOMAIN="$3"
NEW="${ROOT}.new-${STAMP}"
OLD="${ROOT}.old-${STAMP}"

# 1. Extrai para um diretório novo, sem tocar no que está servindo.
rm -rf "$NEW"; mkdir -p "$NEW"
tar -xzf "/tmp/quantical-${STAMP}.tar.gz" -C "$NEW"
chown -R www-data:www-data "$NEW"
find "$NEW" -type d -exec chmod 755 {} +
find "$NEW" -type f -exec chmod 644 {} +

# 2. Snippet de cabeçalhos (precisa existir antes do nginx -t).
mkdir -p /etc/nginx/snippets
cp "/tmp/quantical-headers-${STAMP}.conf" /etc/nginx/snippets/quantical-headers.conf

# 3. Config do nginx, preservando as linhas do certbot deste servidor.
cp /etc/nginx/sites-enabled/quantical "/root/quantical-nginx-backup-${STAMP}.conf"
cat > /etc/nginx/sites-available/quantical <<NGINX
server {
    server_name ${DOMAIN} www.${DOMAIN};

    root ${ROOT};
    index index.html;
    charset utf-8;

    gzip on;
    gzip_vary on;
    gzip_comp_level 6;
    gzip_min_length 512;
    gzip_types text/plain text/css text/javascript text/xml application/javascript application/json application/xml application/manifest+json image/svg+xml;

    location = / {
        include /etc/nginx/snippets/quantical-headers.conf;
        try_files /index.html =404;
    }

    # Episódios de áudio, publicados fora do build por scripts/deploy-audio.sh.
    # Ficam separados porque o artefato do site tem ~1 MB e os mp3 somam dezenas.
    # Casa só o .mp3, e NÃO o prefixo /audio/: as PÁGINAS dos episódios moram
    # em /audio/<slug> e precisam continuar vindo do site. Um location /audio/
    # comum engoliria as duas coisas e as páginas dariam 404.
    location ~ ^/audio/(?<episodio>[^/]+\.mp3)\$ {
        alias /var/www/quantical-audio/\$episodio;
        include /etc/nginx/snippets/quantical-headers.conf;
        # Accept-Ranges é o que permite arrastar a barra sem baixar tudo antes.
        add_header Accept-Ranges bytes always;

        add_header Cache-Control "public, max-age=2592000" always;
        access_log off;
    }

    # API de tentativas e agregados, em Docker na própria máquina.
    #
    # Mesma origem de propósito: sem CORS a configurar e sem origem nova a
    # autorizar no CSP, que já traz connect-src 'self'. O site continua
    # 100% estático — isto aqui é durabilidade, nunca caminho crítico.
    location /api/ {
        proxy_pass http://127.0.0.1:6002;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # Se a API estiver fora do ar, o navegador precisa saber disso rápido
        # para cair no modo local em vez de pendurar a página.
        proxy_connect_timeout 3s;
        proxy_read_timeout 10s;
        proxy_send_timeout 10s;

        client_max_body_size 512k;
    }

    location /_next/static/ {
        include /etc/nginx/snippets/quantical-headers.conf;
        try_files \$uri =404;
        expires 1y;
        add_header Cache-Control "public, immutable" always;
        access_log off;
    }

    location ~* \.html\$ {
        include /etc/nginx/snippets/quantical-headers.conf;
        add_header Cache-Control "no-cache" always;
    }

    location / {
        include /etc/nginx/snippets/quantical-headers.conf;
        # A exportação estática grava cada rota como <rota>.html E TAMBÉM cria
        # um diretório <rota>/ com apenas payloads RSC, sem index.html.
        # Sondar diretório antes do .html (o antigo \$uri/) fazia o try_files
        # parar no diretório vazio: 301 para a barra e depois 403.
        try_files \$uri \$uri.html \$uri/index.html =404;
    }

    error_page 404 /404.html;
    location = /404.html { internal; }

    listen 443 ssl; # managed by Certbot
    listen [::]:443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

server {
    if (\$host = www.${DOMAIN}) { return 301 https://${DOMAIN}\$request_uri; }
    if (\$host = ${DOMAIN}) { return 301 https://\$host\$request_uri; }

    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};
    return 404; # managed by Certbot
}
NGINX
ln -sfn /etc/nginx/sites-available/quantical /etc/nginx/sites-enabled/quantical

# 4. Valida ANTES de trocar o conteúdo. Se falhar, nada mudou.
if ! nginx -t; then
  echo "nginx -t falhou: restaurando config anterior"
  cp "/root/quantical-nginx-backup-${STAMP}.conf" /etc/nginx/sites-available/quantical
  rm -rf "$NEW"
  exit 1
fi

# 5. Troca atômica.
mv "$ROOT" "$OLD"
mv "$NEW" "$ROOT"
systemctl reload nginx

rm -f "/tmp/quantical-${STAMP}.tar.gz" "/tmp/quantical-headers-${STAMP}.conf" "/tmp/quantical-nginx-${STAMP}.conf"

# 6. Mantém só os três backups mais recentes.
ls -dt ${ROOT}.old-* 2>/dev/null | tail -n +4 | xargs -r rm -rf

echo "Publicado. Versão anterior preservada em ${OLD}"
REMOTE

echo "==> Verificando as rotas em produção"
node scripts/check-routes.mjs "https://${DOMAIN}"
echo "==> Pronto: https://${DOMAIN}"
