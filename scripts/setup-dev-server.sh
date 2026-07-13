#!/usr/bin/env bash
# =============================================================================
# setup-dev-server.sh
# Sets up a dev environment for SponsorAtlas on the VPS.
# Run once as root or a sudo user:
#   bash setup-dev-server.sh
# =============================================================================
set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
REPO_URL="https://github.com/rajashwin2017-gif/SponsorAtlas.git"
DEV_BRANCH="lohit"
DEV_DIR="/var/www/sponsoratlas-dev"
DEV_PORT=3001
APP_NAME="sponsoratlas-dev"
DEV_DOMAIN="dev.thesponsorfinder.com"   # change or leave blank to skip nginx
PROD_DIR="/var/www/sponsoratlas"        # used to copy .env as a starting point

# ── Colours ───────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ── 1. Prerequisites ──────────────────────────────────────────────────────────
info "Checking prerequisites..."
command -v node  >/dev/null 2>&1 || error "Node.js not found. Install it first."
command -v npm   >/dev/null 2>&1 || error "npm not found."
command -v git   >/dev/null 2>&1 || error "git not found."
command -v pm2   >/dev/null 2>&1 || { warn "pm2 not found — installing globally..."; npm install -g pm2; }
info "Node $(node -v)  |  npm $(npm -v)  |  pm2 $(pm2 -v)"

# ── 2. Clone / update the repo ───────────────────────────────────────────────
if [ -d "$DEV_DIR/.git" ]; then
  info "Dev directory already exists — pulling latest $DEV_BRANCH..."
  git -C "$DEV_DIR" fetch origin
  git -C "$DEV_DIR" checkout "$DEV_BRANCH"
  git -C "$DEV_DIR" reset --hard "origin/$DEV_BRANCH"
else
  info "Cloning $REPO_URL → $DEV_DIR (branch: $DEV_BRANCH)..."
  git clone --branch "$DEV_BRANCH" "$REPO_URL" "$DEV_DIR"
fi

# ── 3. Create .env for dev ───────────────────────────────────────────────────
ENV_FILE="$DEV_DIR/.env"
if [ -f "$ENV_FILE" ]; then
  warn ".env already exists — skipping creation. Edit $ENV_FILE manually if needed."
else
  info "Creating $ENV_FILE..."

  # Copy production .env as a base if available, then override dev-specific values
  if [ -f "$PROD_DIR/.env" ]; then
    cp "$PROD_DIR/.env" "$ENV_FILE"
    info "Copied production .env as base."
  else
    # Minimal template
    cat > "$ENV_FILE" <<'ENVEOF'
# ── Database ─────────────────────────────────────────────────────────────────
# Point to a separate dev database so dev data never touches production.
DATABASE_URL="mysql://sponsoratlas_dev:CHANGE_ME@localhost:3306/sponsoratlas_dev"

# ── Auth ──────────────────────────────────────────────────────────────────────
NEXTAUTH_URL="http://dev.thesponsorfinder.com"
NEXTAUTH_SECRET="CHANGE_ME_generate_with_openssl_rand_base64_32"

# ── Stripe (use TEST keys for dev) ───────────────────────────────────────────
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# ── Email ─────────────────────────────────────────────────────────────────────
GMAIL_USER=""
GMAIL_APP_PASSWORD=""

# ── OpenAI ───────────────────────────────────────────────────────────────────
OPENAI_API_KEY=""

# ── App URL ───────────────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL="http://dev.thesponsorfinder.com"

NODE_ENV="production"
ENVEOF
  fi

  # Override the values that MUST differ from production
  sed -i "s|^NEXTAUTH_URL=.*|NEXTAUTH_URL=\"http://${DEV_DOMAIN}\"|" "$ENV_FILE"
  sed -i "s|^NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=\"http://${DEV_DOMAIN}\"|" "$ENV_FILE"

  warn "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  warn "IMPORTANT: Edit $ENV_FILE and set:"
  warn "  DATABASE_URL  — use a SEPARATE dev database, not production"
  warn "  STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET — use TEST keys"
  warn "  NEXTAUTH_SECRET — generate with: openssl rand -base64 32"
  warn "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
fi

# ── 4. Install dependencies ───────────────────────────────────────────────────
info "Installing npm dependencies..."
cd "$DEV_DIR"
npm install

# ── 5. Run Prisma migrations ──────────────────────────────────────────────────
info "Running Prisma migrations..."
npx prisma generate
npx prisma db push --accept-data-loss || warn "db push failed — check DATABASE_URL in $ENV_FILE"

# ── 6. Build the Next.js app ──────────────────────────────────────────────────
info "Building Next.js app..."
npm run build

# ── 7. Start / restart with PM2 ──────────────────────────────────────────────
info "Starting app with PM2 (name: $APP_NAME, port: $DEV_PORT)..."
pm2 describe "$APP_NAME" &>/dev/null && pm2 delete "$APP_NAME" || true

pm2 start npm \
  --name "$APP_NAME" \
  --cwd "$DEV_DIR" \
  -- start -- --port "$DEV_PORT"

pm2 save
info "PM2 app '$APP_NAME' running on port $DEV_PORT."

# ── 8. Nginx config (optional) ───────────────────────────────────────────────
NGINX_CONF="/etc/nginx/sites-available/$APP_NAME"
NGINX_LINK="/etc/nginx/sites-enabled/$APP_NAME"

if command -v nginx >/dev/null 2>&1 && [ -n "$DEV_DOMAIN" ]; then
  if [ -f "$NGINX_CONF" ]; then
    warn "Nginx config already exists at $NGINX_CONF — skipping."
  else
    info "Creating nginx config for $DEV_DOMAIN → port $DEV_PORT..."
    cat > "$NGINX_CONF" <<NGINXEOF
server {
    listen 80;
    server_name ${DEV_DOMAIN};

    # Redirect HTTP → HTTPS (remove this block if you don't have SSL yet)
    # return 301 https://\$host\$request_uri;

    location / {
        proxy_pass         http://127.0.0.1:${DEV_PORT};
        proxy_http_version 1.1;
        proxy_set_header   Upgrade \$http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host \$host;
        proxy_set_header   X-Real-IP \$remote_addr;
        proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINXEOF

    ln -sf "$NGINX_CONF" "$NGINX_LINK"
    nginx -t && systemctl reload nginx
    info "Nginx configured. Add DNS A record: $DEV_DOMAIN → 45.151.122.139"
  fi
else
  info "Skipping nginx config (nginx not found or DEV_DOMAIN is empty)."
  info "Access dev app directly at: http://45.151.122.139:${DEV_PORT}"
fi

# ── 9. Summary ────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Dev environment ready!${NC}"
echo ""
echo "  App directory : $DEV_DIR"
echo "  Branch        : $DEV_BRANCH"
echo "  PM2 app name  : $APP_NAME"
echo "  Port          : $DEV_PORT"
echo "  URL           : http://${DEV_DOMAIN}  (or http://45.151.122.139:${DEV_PORT})"
echo ""
echo "  Useful commands:"
echo "    pm2 logs $APP_NAME          # tail logs"
echo "    pm2 restart $APP_NAME       # restart after code changes"
echo "    pm2 stop $APP_NAME          # stop"
echo ""
echo "  To redeploy after a git push:"
echo "    cd $DEV_DIR && git pull origin $DEV_BRANCH && npm install && npm run build && pm2 restart $APP_NAME"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
