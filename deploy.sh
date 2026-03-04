#!/bin/bash
# Auto-deploy script for Papo EPK
# Triggered by GitHub webhook or manual execution

set -e

APP_DIR="/var/www/papo"
LOG_FILE="/var/log/papo-deploy.log"

echo "[$(date)] Deployment started" >> "$LOG_FILE"

cd "$APP_DIR"

# Pull latest changes
git pull origin main >> "$LOG_FILE" 2>&1

# Install dependencies
npm install --production >> "$LOG_FILE" 2>&1

# Build the application
npm run build >> "$LOG_FILE" 2>&1

# Restart the application
pm2 restart papo >> "$LOG_FILE" 2>&1 || pm2 start npm --name "papo" -- start >> "$LOG_FILE" 2>&1

echo "[$(date)] Deployment completed successfully" >> "$LOG_FILE"
