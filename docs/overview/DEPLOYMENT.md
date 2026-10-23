# Deployment Guide — F3N-Bytes

> Setup produksi aplikasi Laravel + Inertia ini.
> Lihat juga: [Arsitektur](./ARCHITECTURE.md) · [Development](./DEVELOPMENT.md)

## 1. Kebutuhan Server

PHP ^8.3 (+ extensi: mbstring, openssl, pdo_mysql, tokenizer, xml, ctype,
curl, fileinfo) · Composer · Node 22+ (untuk build) · MySQL/MariaDB ·
web server (Nginx/Apache) · SSL.

## 2. Langkah Deploy

```bash
composer install --no-dev --optimize-autoloader
cp .env.example .env   # lalu isi: APP_KEY, DB_*, MAIL_*, APP_URL produksi
php artisan key:generate
php artisan migrate --force
npm ci && npm run build
php artisan config:cache && php artisan route:cache && php artisan view:cache
php artisan storage:link   # bila butuh storage publik
```

Document root: `public/`. Pastikan `storage/` & `bootstrap/cache/` writable.

## 3. Checklist Produksi

- [ ] `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL` benar
- [ ] Database + kredensial `.env` produksi (jangan pakai root tanpa password)
- [ ] Migrasi jalan (`migrations` tercatat)
- [ ] Aset `public/build` hasil `npm run build` ter-deploy
- [ ] SSL aktif, session/cookie `secure`
- [ ] Queue worker bila antrean dipakai (`queue:work` via supervisor/systemd)
- [ ] Scheduler cron bila dibutuhkan (`schedule:run` tiap menit)
- [ ] Backup DB berkala + monitoring log (`storage/logs/laravel.log`)

## 4. Laravel Cloud

Alternatif tercepat: deploy via [Laravel Cloud](https://cloud.laravel.com/)
untuk scaling tanpa kelola server manual.
