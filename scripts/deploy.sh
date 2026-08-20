#!/usr/bin/env bash
# Memperbarui instalasi RadGate di VPS. Urutan langkahnya sama dengan
# docs/06-deployment.md bagian 10, supaya yang tertulis di dokumen dan yang
# dijalankan di mesin tidak bisa menyimpang.
set -euo pipefail

ROOT="${ROOT:-/opt/radgate}"
WEB_ROOT="${WEB_ROOT:-/var/www/radgate/web}"
ENV_FILE="${ENV_FILE:-/etc/radgate/api.env}"
APP_USER="${APP_USER:-radgate}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Jalankan sebagai root: sudo $0" >&2
  exit 1
fi

if [[ ! -d "$ROOT/.git" ]]; then
  echo "Direktori $ROOT bukan klon git. Ikuti docs/06-deployment.md dari awal." >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Berkas lingkungan $ENV_FILE tidak ada." >&2
  exit 1
fi

# shellcheck disable=SC1090
set -a
source "$ENV_FILE"
set +a

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL kosong di $ENV_FILE" >&2
  exit 1
fi

run_as_app() {
  runuser -u "$APP_USER" -- env DATABASE_URL="$DATABASE_URL" "$@"
}

echo "==> Mengambil kode terbaru"
cd "$ROOT"
run_as_app git pull --ff-only

echo "==> Memasang dependensi"
run_as_app npm ci --prefix "$ROOT"

echo "==> Membangun shared, API, lalu frontend"
run_as_app npm run build --prefix "$ROOT" --workspace @radgate/shared
run_as_app npm run build --prefix "$ROOT" --workspace @radgate/api

# URL API tertanam di bundel pada saat build. Kalau VITE_API_URL berubah,
# frontend harus dibangun ulang, bukan hanya di-restart.
if [[ -n "${VITE_API_URL:-}" ]]; then
  run_as_app tee "$ROOT/apps/web/.env.production" >/dev/null <<EOF
VITE_API_URL=${VITE_API_URL}
EOF
fi
run_as_app npm run build --prefix "$ROOT" --workspace @radgate/web

echo "==> Menerapkan migrasi database"
cd "$ROOT/apps/api"
if [[ -d prisma/migrations ]] && compgen -G "prisma/migrations/*/migration.sql" >/dev/null; then
  run_as_app npx prisma migrate deploy
else
  echo "Belum ada berkas migrasi; memakai prisma db push untuk skema awal."
  run_as_app npx prisma db push
fi
run_as_app npx prisma generate

echo "==> Memasang berkas frontend"
mkdir -p "$WEB_ROOT"
rsync -a --delete "$ROOT/apps/web/dist/" "$WEB_ROOT/"

echo "==> Menyalakan ulang API"
systemctl restart radgate-api
systemctl --no-pager --full status radgate-api || true

echo "==> Selesai"
echo "Portal: berkas di $WEB_ROOT"
echo "API:    journalctl -u radgate-api -f"
