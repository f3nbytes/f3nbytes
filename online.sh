#!/usr/bin/env bash
#
# online.sh — jalankan f3nbytes mode online.
#
# Pemakaian:
#   ./online.sh                 # default: app 8001, reverb 8091
#   APP_PORT=9001 ./online.sh   # ganti port kalau bentrok
#
# Otomatis memilih jalur koneksi:
#   - Tailscale Funnel  -> dipakai kalau `tailscale` terpasang & ter-login
#                          (URL PERMANEN: https://<nama>.<tailnet>.ts.net)
#                          Setup sekali: sudo bash setup-tailscale.sh
#   - Cloudflare quick  -> kalau Tailscale belum ada (URL berganti tiap sesi)
#
# CATATAN: tailscaled 1.102.x punya bug yang membuat hostname Funnel tidak
#          mendapat record DNS publik (Tailscale issue #21698). Akibatnya URL
#          Funnel hanya bisa dibuka dari dalam tailnet. Script ini mendeteksi
#          kondisi itu dan otomatis beralih ke Cloudflare quick tunnel.
#
# Paksa jalur tertentu (opsional):
#   FORCE_TUNNEL=cloudflared ./online.sh   # pakai Cloudflare walau Tailscale ada
#   FORCE_TUNNEL=tailscale   ./online.sh   # pakai Tailscale tanpa cek DNS publik
#
# Yang dilakukan script ini:
#   1. menentukan & menyalakan jalur koneksi (Tailscale atau cloudflared)
#   2. menulis URL ke .env
#   3. config:clear + npm run build (VITE_REVERB_* ikut ke-bundle)
#   4. menjalankan reverb + serve
#   5. saat Ctrl+C, .env dikembalikan ke mode lokal

set -euo pipefail

cd "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

APP_PORT="${APP_PORT:-8001}"
REVERB_PORT="${REVERB_PORT:-8091}"
PHP_BIN="${PHP_BIN:-php}"

# cloudflared biasanya terpasang di ~/.local/bin
export PATH="$HOME/.local/bin:$PATH"

# Override ekstensi PHP (mesin ini menyimpannya di ~/.config/php/conf.d)
if [ -d "$HOME/.config/php/conf.d" ]; then
    export PHP_INI_SCAN_DIR="$HOME/.config/php/conf.d${PHP_INI_SCAN_DIR:+:$PHP_INI_SCAN_DIR}"
fi

log() { printf '\033[36m[online]\033[0m %s\n' "$*"; }
warn() { printf '\033[33m[online]\033[0m %s\n' "$*" >&2; }
err() { printf '\033[31m[online]\033[0m %s\n' "$*" >&2; }

command -v "$PHP_BIN" >/dev/null || { err "$PHP_BIN tidak ditemukan"; exit 1; }
command -v npm >/dev/null || { err "npm tidak ditemukan"; exit 1; }

port_busy() {
    (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null
}

for port in "$APP_PORT" "$REVERB_PORT"; do
    if port_busy "$port"; then
        err "Port $port sudah dipakai. Stop proses itu dulu, atau jalankan dengan APP_PORT/REVERB_PORT lain."
        exit 1
    fi
done

LOG_DIR="$(mktemp -d "${TMPDIR:-/tmp}/f3n-online.XXXXXX")"
HTTP_LOG="$LOG_DIR/http.log"
WS_LOG="$LOG_DIR/ws.log"
SHARE_FILE="$PWD/online-url.txt"

HTTP_PID=""
WS_PID=""
SERVE_PID=""
REVERB_PID=""
ENV_CHANGED=0
MODE="tunnel"

set_env() {
    local key="$1" value="$2"

    if grep -q "^${key}=" .env; then
        sed -i "s|^${key}=.*|${key}=${value}|" .env
    else
        printf '%s=%s\n' "$key" "$value" >>.env
    fi
}

cleanup() {
    trap - EXIT INT TERM

    echo
    log "Menghentikan layanan..."

    for pid in "$SERVE_PID" "$REVERB_PID" "$HTTP_PID" "$WS_PID"; do
        if [ -n "$pid" ]; then
            kill "$pid" 2>/dev/null || true
        fi
    done

    sleep 1

    if [ "$ENV_CHANGED" = "1" ]; then
        log "Mengembalikan .env ke mode lokal..."

        set_env APP_URL "http://127.0.0.1:$APP_PORT"
        set_env ASSET_URL "http://127.0.0.1:$APP_PORT"
        set_env REVERB_HOST "127.0.0.1"
        set_env REVERB_PORT "$REVERB_PORT"
        set_env REVERB_SCHEME "http"
        set_env REVERB_SERVER_HOST "127.0.0.1"
        set_env REVERB_SERVER_PORT "$REVERB_PORT"
        set_env VITE_REVERB_HOST "127.0.0.1"
        set_env VITE_REVERB_PORT "$REVERB_PORT"
        set_env VITE_REVERB_SCHEME "http"

        "$PHP_BIN" artisan config:clear >/dev/null 2>&1 || true
        npm run build >/dev/null 2>&1 || true
    fi

    rm -rf "$LOG_DIR"

    if [ "$MODE" = "tunnel" ]; then
        rm -f "$SHARE_FILE"
    fi

    log "Selesai."
}

trap cleanup EXIT INT TERM

wait_url() {
    local file="$1" tries="${2:-40}" url=""

    for _ in $(seq 1 "$tries"); do
        url="$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$file" 2>/dev/null | head -1 || true)"

        if [ -n "$url" ]; then
            printf '%s' "$url"

            return 0
        fi

        sleep 1
    done

    return 1
}

# --- Pilih jalur koneksi: Tailscale (permanen) atau Cloudflare quick tunnel ---

# Cek apakah hostname Funnel punya record A publik.
# tailscaled 1.102.x bisa gagal mempublikasikannya (Tailscale issue #21698),
# sehingga URL hanya bisa dibuka dari dalam tailnet.
funnel_has_public_dns() {
    local host="$1" out

    out="$(curl -s --max-time 8 \
        -H 'accept: application/dns-json' \
        "https://cloudflare-dns.com/dns-query?name=$host&type=A" 2>/dev/null || true)"

    # Respons positif punya bagian "Answer"; NODATA/NXDOMAIN tidak punya.
    grep -q '"Answer"' <<<"$out"
}

FORCE_TUNNEL="${FORCE_TUNNEL:-auto}"

TS_HOST=""
if [ "$FORCE_TUNNEL" != "cloudflared" ] \
    && command -v tailscale >/dev/null 2>&1 \
    && tailscale status >/dev/null 2>&1; then
    TS_HOST="$(tailscale status --json 2>/dev/null \
        | grep -oE '"DNSName"[[:space:]]*:[[:space:]]*"[^"]+"' \
        | head -1 \
        | sed -E 's/.*"([^"]+)"$/\1/' \
        | sed 's/\.$//')" || true
fi

if [ -n "$TS_HOST" ] && [ "$FORCE_TUNNEL" = "auto" ] && ! funnel_has_public_dns "$TS_HOST"; then
    warn "Funnel aktif, tapi $TS_HOST belum punya record DNS publik."
    warn "Ini bug tailscaled 1.102.x (Tailscale issue #21698): URL Funnel hanya"
    warn "bisa dibuka dari dalam tailnet. Beralih ke Cloudflare quick tunnel."
    TS_HOST=""
fi

if [ -n "$TS_HOST" ]; then
    MODE="tailscale"
    log "Mode: Tailscale Funnel (URL permanen)"
    HTTP_URL="https://$TS_HOST"
    WS_HOST="$TS_HOST"
    WS_PORT="8443"

    FUNNEL_STATUS="$(tailscale funnel status 2>/dev/null || true)"

    if ! grep -q ":$WS_PORT" <<<"$FUNNEL_STATUS"; then
        err "Funnel port $WS_PORT (Reverb) belum aktif. Jalankan: sudo bash setup-tailscale.sh"
    fi

    log "Reverb : wss://$WS_HOST:$WS_PORT"
else
    log "Mode: Cloudflare quick tunnel (URL berganti tiap sesi)"
    command -v cloudflared >/dev/null || { err "cloudflared tidak ditemukan di PATH"; exit 1; }

    log "Menyalakan tunnel aplikasi (port $APP_PORT)..."
    cloudflared tunnel --url "http://127.0.0.1:$APP_PORT" \
        --no-autoupdate --logfile "$HTTP_LOG" >/dev/null 2>&1 &
    HTTP_PID=$!

    log "Menyalakan tunnel Reverb (port $REVERB_PORT)..."
    cloudflared tunnel --url "http://127.0.0.1:$REVERB_PORT" \
        --no-autoupdate --logfile "$WS_LOG" >/dev/null 2>&1 &
    WS_PID=$!

    log "Menunggu URL tunnel..."
    HTTP_URL="$(wait_url "$HTTP_LOG")" || { err "Gagal mendapat URL tunnel aplikasi"; exit 1; }
    WS_URL="$(wait_url "$WS_LOG")" || { err "Gagal mendapat URL tunnel Reverb"; exit 1; }
    WS_HOST="${WS_URL#https://}"
    WS_PORT="443"

    log "Reverb : $WS_URL"
fi

log "App    : $HTTP_URL"

log "Menulis konfigurasi ke .env..."
set_env APP_URL "$HTTP_URL"
set_env ASSET_URL "$HTTP_URL"
set_env REVERB_HOST "$WS_HOST"
set_env REVERB_PORT "$WS_PORT"
set_env REVERB_SCHEME "https"
set_env REVERB_SERVER_HOST "127.0.0.1"
set_env REVERB_SERVER_PORT "$REVERB_PORT"
set_env VITE_REVERB_HOST "$WS_HOST"
set_env VITE_REVERB_PORT "$WS_PORT"
set_env VITE_REVERB_SCHEME "https"
ENV_CHANGED=1

log "Membersihkan cache config..."
"$PHP_BIN" artisan config:clear >/dev/null

log "Build frontend..."
npm run build >/dev/null

log "Menjalankan Reverb..."
"$PHP_BIN" artisan reverb:start --host=127.0.0.1 --port="$REVERB_PORT" \
    >"$LOG_DIR/reverb.log" 2>&1 &
REVERB_PID=$!

log "Menjalankan Laravel..."
"$PHP_BIN" artisan serve --host=127.0.0.1 --port="$APP_PORT" \
    >"$LOG_DIR/serve.log" 2>&1 &
SERVE_PID=$!

for _ in $(seq 1 30); do
    if curl -sf -o /dev/null "http://127.0.0.1:$APP_PORT"; then
        break
    fi

    sleep 0.5
done

if ! curl -sf -o /dev/null "$HTTP_URL"; then
    err "Tunnel belum merespons. Cek $LOG_DIR/http.log"
fi

printf '%s\n' "$HTTP_URL" >"$SHARE_FILE"

echo
echo "=============================================================="
echo "  f3nbytes ONLINE"
echo

if [ "$MODE" = "tailscale" ]; then
    echo "  URL permanen (selalu sama):"
else
    echo "  URL berlaku selama sesi ini saja:"
fi

echo
echo "    $HTTP_URL"
echo
echo "  Tersimpan juga di: online-url.txt"
echo
echo "  (Ctrl+C untuk stop & kembali ke mode lokal)"
echo "=============================================================="
echo

if command -v qrencode >/dev/null 2>&1; then
    echo "  Scan QR untuk buka di HP:"
    echo
    qrencode -t ANSIUTF8 -m 1 "$HTTP_URL" || true
    echo
fi

wait
