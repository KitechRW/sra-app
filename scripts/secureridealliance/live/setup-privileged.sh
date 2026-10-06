#!/usr/bin/env bash
set -euo pipefail

DOMAIN="app.secureridealliance.rw"
FRONTEND_DIR="/srv/www/secureridealliance.rw/web/live/app"
ARTIFACT_DIR="/home/deploy/artifacts/secureridealliance-live-app"
NGINX_AVAILABLE="/etc/nginx/sites-available/$DOMAIN"
NGINX_ENABLED="/etc/nginx/sites-enabled/$DOMAIN"
NGINX_SOURCE="/scripts/secureridealliance/live/nginx-app.secureridealliance.rw.conf"

if [ "$(id -u)" -ne 0 ]; then
  echo "ERROR: run this script as root or with sudo." >&2
  exit 1
fi

install -d -o deploy -g www-data -m 2775 "$FRONTEND_DIR"
setfacl -Rm u:deploy:rwx,u:www-data:rx,m:rwx "$FRONTEND_DIR"
setfacl -dm u:deploy:rwx,u:www-data:rx,m:rwx "$FRONTEND_DIR"

if [ -d "$ARTIFACT_DIR" ]; then
  rsync -a --delete "$ARTIFACT_DIR/" "$FRONTEND_DIR/"
  chown -R deploy:www-data "$FRONTEND_DIR"
  find "$FRONTEND_DIR" -type d -exec chmod 2775 {} \;
  find "$FRONTEND_DIR" -type f -exec chmod 664 {} \;
fi

cp "$NGINX_SOURCE" "$NGINX_AVAILABLE"
ln -sfn "$NGINX_AVAILABLE" "$NGINX_ENABLED"
nginx -t
systemctl reload nginx

if command -v certbot >/dev/null 2>&1; then
  certbot --nginx -d "$DOMAIN" --redirect --non-interactive --agree-tos --register-unsafely-without-email
fi

nginx -t
systemctl reload nginx
echo "Privileged setup complete for $DOMAIN"
