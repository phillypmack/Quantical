#!/usr/bin/env bash
# Publica os episódios de áudio, separados do build do site.
#
# Os mp3 não entram em `out/`: o artefato do site tem ~1 MB e 18 episódios
# somariam quase 90 MB em cada deploy, sem que nada neles tenha mudado. Aqui
# só sobe o que é novo ou diferente, comparando o hash local com o remoto.
#
# Uso:
#   ./scripts/deploy-audio.sh [usuario@host]                 # episódios
#   ./scripts/deploy-audio.sh [usuario@host] livro DIR       # audiolivro
#
# O segundo argumento é o subdiretório sob /audio/ — os capítulos do livro
# moram em /audio/livro/ para não se misturarem com os episódios dos módulos,
# que têm outra natureza e outro ciclo de vida.
set -euo pipefail

TARGET="${1:-root@187.77.8.195}"
SUB="${2:-}"
RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

REMOTO="/var/www/quantical-audio${SUB:+/$SUB}"
URL_BASE="https://quantical.com.br/audio${SUB:+/$SUB}"
LOCAL="${3:-$RAIZ/media/audio}"

if [ ! -d "$LOCAL" ]; then
  echo "Diretório de áudio não encontrado: $LOCAL"
  echo "Gere antes:  cd ../Dubla && python -m dubla narrar <roteiros> --out <saida>"
  exit 1
fi

mapfile -t ARQUIVOS < <(find "$LOCAL" -maxdepth 1 -name "*.mp3" -printf "%f\n" | sort)
if [ ${#ARQUIVOS[@]} -eq 0 ]; then
  echo "Nenhum mp3 em media/audio."
  exit 1
fi

echo "==> ${#ARQUIVOS[@]} arquivo(s) em $LOCAL"

# Hashes remotos numa ida só: uma conexão SSH por arquivo seria lento e ruidoso.
REMOTOS="$(ssh "$TARGET" "mkdir -p $REMOTO && md5sum $REMOTO/*.mp3 2>/dev/null || true")"

ENVIAR=()
for arquivo in "${ARQUIVOS[@]}"; do
  local_hash="$(md5sum "$LOCAL/$arquivo" | cut -d' ' -f1)"
  remoto_hash="$(echo "$REMOTOS" | grep -F "/$arquivo" | cut -d' ' -f1 || true)"
  if [ "$local_hash" != "$remoto_hash" ]; then
    ENVIAR+=("$arquivo")
  fi
done

if [ ${#ENVIAR[@]} -eq 0 ]; then
  echo "==> Tudo já está publicado e igual."
else
  echo "==> Enviando ${#ENVIAR[@]}:"
  for arquivo in "${ENVIAR[@]}"; do
    tamanho="$(du -h "$LOCAL/$arquivo" | cut -f1)"
    echo "    $arquivo ($tamanho)"
    scp -q "$LOCAL/$arquivo" "$TARGET:$REMOTO/"
  done
  ssh "$TARGET" "chown -R www-data:www-data $REMOTO && chmod 644 $REMOTO/*.mp3"
fi

echo "==> Conferindo em produção"
FALHAS=0
for arquivo in "${ARQUIVOS[@]}"; do
  codigo="$(curl -s -o /dev/null -w '%{http_code}' -I "$URL_BASE/$arquivo")"
  if [ "$codigo" != "200" ]; then
    echo "    $arquivo -> $codigo"
    FALHAS=$((FALHAS + 1))
  fi
done

if [ "$FALHAS" -gt 0 ]; then
  echo "$FALHAS arquivo(s) não respondem 200. Confira o bloco /audio/ do nginx."
  exit 1
fi

echo "==> ${#ARQUIVOS[@]} arquivo(s) respondendo 200 em $URL_BASE/"
