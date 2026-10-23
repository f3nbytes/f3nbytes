#!/usr/bin/env bash
#
# setup-tailscale.sh — pasang Tailscale + aktifkan Funnel (SEKALI SAJA).
#
# Butuh akses root, karena itu harus dijalankan sendiri olehmu:
#
#     sudo bash setup-tailscale.sh
#
# Setelah ini, cukup pakai ./online.sh seperti biasa — script itu akan
# otomatis memakai Tailscale dan memberi URL PERMANEN.

set -euo pipefail

APP_PORT="${APP_PORT:-8001}"
REVERB_PORT="${REVERB_PORT:-8091}"
NODE_NAME="${NODE_NAME:-f3nbytes}"

if [ "$(id -u)" -ne 0 ]; then
    echo "Jalankan dengan: sudo bash $0" >&2
    exit 1
fi

echo "== 1/4  Memasang paket Tailscale =="

if command -v tailscale >/dev/null 2>&1; then
    echo "   tailscale sudah terpasang, dilewati."
else
    pacman -S --needed --noconfirm tailscale
fi

echo "== 2/4  Mengaktifkan service tailscaled =="
systemctl enable --now tailscaled

echo "== 3/4  Login Tailscale =="
echo "   Buka link yang muncul di bawah ini, lalu login (Google/GitHub/Microsoft)."
echo

if tailscale status >/dev/null 2>&1; then
    echo "   Sudah login, dilewati."
else
    tailscale up --hostname="$NODE_NAME"
fi

TS_HOST="$(tailscale status --json 2>/dev/null \
    | grep -oE '"DNSName"[[:space:]]*:[[:space:]]*"[^"]+"' \
    | head -1 \
    | sed -E 's/.*"([^"]+)"$/\1/' \
    | sed 's/\.$//')" || true

if [ -z "$TS_HOST" ]; then
    echo
    echo "!! Gagal membaca hostname Tailscale." >&2
    echo "   Pastikan sudah login (jalankan: tailscale status), lalu ulangi script ini." >&2
    exit 1
fi

echo
echo "== 4/4  Mengaktifkan Funnel =="
echo "   port 443  -> aplikasi  (127.0.0.1:$APP_PORT)"

if ! tailscale funnel --bg --https=443 "http://127.0.0.1:$APP_PORT"; then
    echo
    echo "!! Funnel gagal diaktifkan." >&2
    echo "   Kemungkinan Funnel belum diizinkan untuk tailnet-mu." >&2
    echo "   Buka: https://login.tailscale.com/admin/acls" >&2
    echo "   aktifkan Funnel (bagian nodeAttrs / Funnel), lalu ulangi." >&2
    exit 1
fi

echo "   port 8443 -> Reverb     (127.0.0.1:$REVERB_PORT)"
tailscale funnel --bg --https=8443 "http://127.0.0.1:$REVERB_PORT" || {
    echo "   (peringatan: Funnel 8443 gagal — WebSocket online mungkin tidak jalan)" >&2
}

echo
tailscale funnel status || true

echo
echo "=============================================================="
echo "  BERHASIL! URL permanen kamu:"
echo
echo "     https://$TS_HOST"
echo
echo "  WebSocket Reverb: wss://$TS_HOST:8443"
echo "=============================================================="
echo
echo "Langkah berikutnya (di folder project, tanpa sudo):"
echo
echo "     ./online.sh"
echo
