# API Reference — F3N-Bytes

> Referensi route, controller & komponen. Proyek ini SPA Inertia —
> tidak ada REST API publik terpisah.
> Lihat juga: [Arsitektur](./ARCHITECTURE.md) · [PRD](./PRD.md)

## 1. Halaman Inertia (`routes/web.php`)

| Method | URI | Komponen | Middleware | Keterangan |
| --- | --- | --- | --- | --- |
| GET | `/` | `welcome` | — | Landing (prop `canRegister`) |
| GET | `/projects` | `projects` | — | Showcase semua proyek |
| GET | `/dashboard` | `dashboard` | `auth`, `verified` | Placeholder grid |

## 2. Settings (`routes/settings.php`)

| Method | URI | Controller | Middleware |
| --- | --- | --- | --- |
| GET | `/settings` | redirect → `/settings/profile` | `auth` |
| GET/PATCH | `/settings/profile` | `Settings\ProfileController@edit/update` | `auth` |
| DELETE | `/settings/profile` | `Settings\ProfileController@destroy` | `auth`, `verified` |
| GET | `/settings/security` | `Settings\SecurityController@edit` | `auth`, `verified` |
| PUT | `/settings/password` | `Settings\SecurityController@update` | `auth`, `verified`, `throttle:6,1` |
| GET | `/settings/appearance` | halaman `settings/appearance` | `auth`, `verified` |

## 3. Auth Fortify (bawaan)

Register · login · logout · lupa/reset password · verifikasi email ·
konfirmasi password · 2FA (`/two-factor-challenge`, enable/confirm/disable,
recovery codes). Session driver: database.

## 4. Rute TypeScript (Wayfinder)

Fungsi route ter-generate otomatis di `resources/js/routes/` — dipakai di
frontend, mis. `projectsIndex()` untuk link dan `dashboard()` untuk breadcrumb.
Regenerasi saat build (`vite-plugin-wayfinder`).

## 5. Komponen Frontend Utama

| Lokasi | Isi |
| --- | --- |
| `pages/welcome.tsx` | Landing 3 bahasa + toggle tema |
| `pages/projects.tsx` | Showcase 4 proyek |
| `pages/dashboard.tsx` | Dashboard (placeholder) |
| `pages/auth/*` | Login, register, 2FA, password, verifikasi |
| `pages/settings/*` | Profile, security, appearance |
| `components/app-*.tsx` | Shell, header, sidebar |
| `components/ui/*` | shadcn/ui (button, card, dialog, dsb.) |
| `hooks/use-appearance.tsx` | Tema Terang default, simpan localStorage + cookie |
| `layouts/*` | app-layout, auth-layout, settings/layout |
