# Development Guide — F3N-Bytes

> Workflow & konvensi development.
> Lihat juga: [Arsitektur](./ARCHITECTURE.md) · [API](./API.md)

## 1. Prasyarat

PHP ^8.3 + Composer · Node 22+ · MySQL/MariaDB lokal jalan.

## 2. Setup Awal

```bash
composer install
cp .env.example .env && php artisan key:generate
mysql -h 127.0.0.1 -u root --skip-ssl \
  -e "CREATE DATABASE IF NOT EXISTS f3nbytes CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
php artisan migrate --force
npm install && npm run build
```

`.env` untuk database lokal:

```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=f3nbytes
DB_USERNAME=root
DB_PASSWORD=
```

## 3. Jalan Lokal (2 terminal)

```bash
php artisan serve --host=127.0.0.1 --port=8002   # 8000 biasanya terpakai
npm run dev                                       # HMR di :5173
```

Buka `http://127.0.0.1:8002/`. Perubahan frontend hot-reload otomatis.

## 4. Cek Kualitas (wajib sebelum selesai)

```bash
npm run types:check        # tsc --noEmit
npm run lint:check         # eslint (catatan: 7 error bawaan di welcome/projects)
npm run build              # vite build
vendor/bin/pint --dirty    # format PHP yang berubah
```

## 5. Konvensi

- PHP: ikuti file sekitar (constructor promotion, return type eksplisit,
  PHPDoc untuk array shape). Jangan ubah dependensi tanpa persetujuan.
- Frontend: cek komponen `ui/*` yang ada sebelum bikin baru; halaman baru di
  `pages/` + daftarkan route Inertia; pola `dark:` untuk dark mode.
- Utilitas tema light-only (`glass`, `pixel-*`) di `app.css` — scoped
  `html:not(.dark)`, jangan dipakai untuk dark mode.
- Test: Pest untuk setiap perubahan (`php artisan test --compact --filter=...`).
- Format otomatis: Prettier untuk `resources/` (`npx prettier --write <file>`).
