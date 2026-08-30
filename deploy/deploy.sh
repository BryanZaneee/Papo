#!/bin/bash
# Deploy the AYOPAPO EPK + admin API to the VPS.
# Usage: ./deploy/deploy.sh root@100.88.216.70
#
# The admin password ships as a bcrypt hash inside api/config.json (gitignored).
# Create/rotate it locally with: cd api && node setup.js '<password>'

set -euo pipefail

VPS="${1:?Usage: ./deploy/deploy.sh <vps-host>}"
SITE_DIR="/var/www/papo-static"   # Caddy web root: index.html, src/, Assets/, admin/
APP_DIR="/var/www/papo"           # api/ + content/ — outside the web root
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

[ -f "$ROOT/api/config.json" ] || { echo "api/config.json missing — run: cd api && node setup.js '<password>'"; exit 1; }

echo "=== Deploying AYOPAPO to ${VPS} ==="

echo "[1/6] Building the admin..."
(cd "$ROOT" && npm run build)

echo "[2/6] Copying site, admin and API..."
ssh "$VPS" "command -v node >/dev/null 2>&1 || { curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && apt-get install -y nodejs; }"
ssh "$VPS" "mkdir -p ${SITE_DIR}/admin ${APP_DIR}/api ${APP_DIR}/content/uploads ${APP_DIR}/content/.backups"
# WAV masters, PSDs and the raw poster originals never leave this machine.
rsync -az --delete --exclude '*.wav' --exclude '*.WAV' --exclude '*.psd' --exclude 'DJ Event Archives' \
	"$ROOT/index.html" "$ROOT/src" "$ROOT/Assets" "${VPS}:${SITE_DIR}/"
rsync -az --delete "$ROOT/dist/admin/" "${VPS}:${SITE_DIR}/admin/"
rsync -az "$ROOT/api/server.js" "$ROOT/api/setup.js" "$ROOT/api/package.json" "$ROOT/api/config.json" "${VPS}:${APP_DIR}/api/"

# Content is SEED ONLY — never overwrite. The client edits this live through the
# admin; an unconditional copy would destroy everything he has published since
# your last pull, and (bypassing the API) leave no copy in content/.backups.
echo "[3/6] Seeding content (existing files are left untouched)..."
rsync -az --ignore-existing --exclude '.backups' "$ROOT/content/" "${VPS}:${APP_DIR}/content/"

echo "[4/6] Installing API dependencies..."
ssh "$VPS" "cd ${APP_DIR}/api && npm install --omit=dev --no-audit --no-fund"

echo "[5/6] Permissions + systemd..."
ssh "$VPS" "chown -R www-data:www-data ${APP_DIR}"
rsync -az "$ROOT/deploy/papo-api.service" "${VPS}:/etc/systemd/system/"
ssh "$VPS" "systemctl daemon-reload && systemctl enable papo-api >/dev/null && systemctl restart papo-api"
sleep 2
echo "  API status: $(ssh "$VPS" "systemctl is-active papo-api")"

echo "[6/6] Caddy"
if ssh "$VPS" "grep -q 'reverse_proxy 127.0.0.1:3006' /etc/caddy/Caddyfile"; then
	echo "  Caddy block already present — reloading."
	ssh "$VPS" "systemctl reload caddy"
else
	echo "  Replace the ayopapo.studio block in /etc/caddy/Caddyfile with deploy/caddy-papo.conf, then: systemctl reload caddy"
fi

echo
echo "=== Done. Site: https://ayopapo.studio/   Editor: https://ayopapo.studio/admin/ ==="
