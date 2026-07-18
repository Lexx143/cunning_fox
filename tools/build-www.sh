#!/bin/bash
# Сборка www/ — чистая копия игры для Capacitor и деплоя (webp вместо png)
set -e
cd "$(dirname "$0")/.."
rm -rf www
mkdir -p www
rsync -a \
  --exclude='*.png' \
  --include='index.html' --include='privacy.html' \
  --include='css/***' --include='js/***' \
  --include='assets/***' \
  --exclude='*' \
  ./ www/
echo "www/ built: $(du -sh www | cut -f1)"
