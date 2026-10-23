# Arsitektur — F3N-Bytes

> Lihat juga: [Overview](./OUTLINE-FEATURES.md) · [PRD](./PRD.md) · [Modul Game](./GAME-MODULES.md) · [ERD](../flowchart/erd.md) · [Flowchart](../flowchart/flowchart.md)

## 1. Stack

| Lapisan | Teknologi |
| --- | --- |
| Backend | Laravel 13 (PHP ^8.3), Inertia Laravel 3, Fortify (auth + 2FA) |
| Frontend | React 19, Inertia React 3, Tailwind CSS 4, Framer Motion, shadcn/ui (Radix) |
| Database | MySQL/MariaDB (`f3nbytes`), driver database untuk session/cache/queue |
| Build | Vite 8 + laravel-vite-plugin, Wayfinder (route TS), font Bunny (Poppins + Press Start 2P) |
| Test | Pest 4 + PHPUnit 12 · Format: Pint (PHP), Prettier + ESLint (JS) |

## 2. Struktur Direktori (ringkas)

```
app/Http/Controllers/Settings/  → ProfileController, SecurityController
app/Http/Middleware/            → HandleAppearance (default tema: light)
resources/js/pages/             → welcome, projects, dashboard, auth/*, settings/*
resources/js/components/        → app-shell/header/sidebar, ui/* (shadcn)
resources/js/hooks/             → use-appearance (tema), use-mobile, dsb.
resources/js/layouts/           → app-layout, auth-layout, settings/layout
resources/css/app.css           → token Tailwind v4 + utilitas .glass/.pixel-*
resources/views/app.blade.php   → root Inertia + deteksi tema awal
routes/                         → web.php, settings.php (+ Fortify)
database/migrations/            → users, cache, jobs, 2FA (4 batch)
docs/                           → overview/*, flowchart/* (dokumentasi)
```

## 3. Alur Request (Inertia SPA)

```
Browser → routes/web.php → halaman Inertia (welcome/projects/dashboard)
        → komponen React di pages/* → render, tanpa REST API terpisah
Form    → Controller (Settings/*) / Fortify Actions → redirect + toast
```

Rute TypeScript di-generate oleh Wayfinder (`resources/js/routes/`).

## 4. Sistem Tema (Terang default)

1. `HandleAppearance` membaca cookie `appearance`, default **`light`**.
2. `app.blade.php` inject class `dark` + `colorScheme` sebelum render (anti-flicker).
3. `use-appearance.tsx` (`initializeTheme`) memigrasi simpanan kosong/`system` → `light`;
   toggle manual tersimpan ke localStorage + cookie (server ikut tahu).
4. Styling: token oklch di `app.css` (`:root` terang, `.dark` gelap) + utilitas
   `html:not(.dark) .glass/.pixel-*` yang **tidak menyentuh dark mode**.

## 5. Auth (Fortify)

Register · login · reset password · verifikasi email · konfirmasi password ·
2FA (secret + recovery codes + `two_factor_confirmed_at`). Proteksi route:
`auth` untuk settings, `auth + verified` untuk dashboard & hapus akun,
throttle `6/menit` untuk ganti password.

## 6. Development Lokal

Ringkasan; panduan lengkap di [DEVELOPMENT](./DEVELOPMENT.md).

```bash
composer install
cp .env.example .env && php artisan key:generate
# MySQL: CREATE DATABASE f3nbytes CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
# .env: DB_CONNECTION=mysql, DB_HOST=127.0.0.1, DB_PORT=3306,
#       DB_DATABASE=f3nbytes, DB_USERNAME=root, DB_PASSWORD=
php artisan migrate --force
npm install && npm run build

# jalan (2 terminal):
php artisan serve --host=127.0.0.1 --port=8002   # 8000 biasanya terpakai
npm run dev                                       # HMR di :5173
```

Cek kualitas: `npm run types:check`, `npm run lint:check`, `npm run build`,
`vendor/bin/pint --dirty` (PHP). Catatan: 7 error ESLint di `welcome.tsx`/
`projects.tsx` (import-order + set-state-in-effect) adalah bawaan, bukan regresi.
