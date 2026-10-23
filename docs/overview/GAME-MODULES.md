# Modul Game & Map — F3N-Bytes

> Dokumen ini menjelaskan modul yang dipakai oleh **game utama `/game`**,
> termasuk map sekolah yang digambar di `resources/js/game/pixel-story.ts`.
>
> Halaman `/game/phaser` dan `/map-editor` adalah eksperimen terpisah dan
> **tidak dipakai** oleh map sekolah di game utama.

## 1. Ringkasan

Map sekolah **tidak memakai Phaser, tilemap, atau file gambar map**. Map
digambar langsung dengan **HTML5 Canvas 2D API** di TypeScript, lalu disimpan
sebagai snapshot canvas agar tidak flicker.

Alurnya:

```text
React (game.tsx)
  └─ PixelStoryGame (pixel-story.ts)
       ├─ Canvas 2D  → gambar map, gedung, jalan, pohon, properti
       ├─ Snapshot   → cache map statis per map/room
       └─ Game loop  → player, kamera, NPC, combat, quest
```

## 2. Modul Inti Game

| Modul / Teknologi       | Dipakai untuk                                                                            |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| **TypeScript**          | Bahasa utama game dan map                                                                |
| **HTML5 Canvas 2D API** | Menggambar seluruh map: paving, rumput, gedung, pohon, bayangan, jalan, gapura, properti |
| **React 19**            | Membungkus game, HUD, dialog, dan kontrol UI                                             |
| **Inertia.js 3**        | Menghubungkan halaman `/game` dengan Laravel tanpa API terpisah                          |
| **Vite 8**              | Build frontend dan asset bundling                                                        |
| **Laravel 13**          | Route `/game`, backend API room, dan autentikasi                                         |
| **Laravel Fortify**     | Login, register, verifikasi, dan 2FA                                                     |

### File utama

| File                               | Isi                                                            |
| ---------------------------------- | -------------------------------------------------------------- |
| `resources/js/pages/game.tsx`      | Halaman React: HUD, dialog, form room, kontrol                 |
| `resources/js/game/pixel-story.ts` | Engine game 2D: render map, kamera, player, NPC, combat, quest |
| `resources/js/game/net.ts`         | Koneksi Reverb/Echo dan API room multiplayer                   |
| `resources/js/game/sound.ts`       | SFX/musik chiptune procedural memakai Web Audio API            |
| `routes/web.php`                   | Route `/game`, `/game/phaser`, `/map-editor`, dan `api/game/*` |

### Cara map digambar

- Semua elemen map dibuat lewat `fillRect`, `arc`, path, dan gradient.
- Tidak ada file tilemap atau tileset untuk map utama.
- Nilai acak tekstur memakai fungsi deterministik `nz()` supaya hasil snapshot
  selalu sama dan tidak berkedip.
- `mapSnapshot()` menyimpan hasil render map ke canvas cache per `mapName` +
  `roomName`.
- Detail map yang ditambahkan: paving batu, rumput, bed bunga, pagar/hedge,
  pohon dengan lubang tanam, bayangan gedung, lampu, bangku, tempat sampah,
  papan informasi, parkir, gapura, pos satpam, bendera, trotoar, zebra cross,
  dan marka jalan.

## 3. Modul UI Pendukung

Modul berikut dipakai di halaman game dan/atau UI proyek:

| Modul                               | Fungsi                                              |
| ----------------------------------- | --------------------------------------------------- |
| `tailwindcss` + `@tailwindcss/vite` | Styling halaman dan HUD                             |
| `framer-motion`                     | Animasi panel, dialog, dan transisi                 |
| `lucide-react`                      | Ikon kontrol dan HUD                                |
| `@radix-ui/react-*`                 | Komponen UI dasar (dialog, dropdown, tooltip, dll.) |
| `@headlessui/react`                 | Komponen aksesibel tambahan                         |
| `sonner`                            | Notifikasi/toast                                    |
| `clsx`, `tailwind-merge`            | Penggabung class Tailwind                           |
| `class-variance-authority`          | Varian komponen UI                                  |
| `liquid-glass-react`                | Efek kaca pada UI                                   |
| `input-otp`                         | Input kode OTP autentikasi                          |
| `tw-animate-css`                    | Animasi CSS tambahan                                |

## 4. Modul Online / Realtime

| Modul                | Fungsi                                                 |
| -------------------- | ------------------------------------------------------ |
| `laravel/reverb`     | WebSocket server Laravel                               |
| `laravel-echo`       | Client WebSocket di frontend                           |
| `pusher-js`          | Protokol Pusher yang dipakai Reverb                    |
| `GameRoomController` | API room: create, join, pick hero, start, state, input |

Konfigurasi Reverb memakai `VITE_REVERB_*` dan `REVERB_*` dari `.env`.
Jalankan server Reverb dengan:

```bash
php artisan reverb:start --host=127.0.0.1 --port=8091
```

## 5. Phaser dan Map Editor (Terpisah)

| Modul / Halaman  | Status                                                                                |
| ---------------- | ------------------------------------------------------------------------------------- |
| `phaser ^4.2.1`  | Hanya untuk demo `/game/phaser` di `resources/js/game/phaser/*`                       |
| `/map-editor`    | Editor tilemap eksperimen berbasis tileset `public/game-assets/airlangga_tileset.png` |
| `pixel-story.ts` | Game utama; **tidak memakai Phaser**                                                  |

Jadi jika yang dimaksud adalah map sekolah yang sekarang dipakai di `/game`,
modul utamanya adalah **Canvas 2D + TypeScript + React/Inertia**, bukan Phaser.

## 6. Tooling Development

| Tool     | Fungsi                |
| -------- | --------------------- |
| ESLint   | Lint TypeScript/React |
| Prettier | Format kode           |
| `tsc`    | Type checking         |
| Pest 4   | Test PHP/Laravel      |
| Pint     | Format PHP            |
| Vite     | Build asset           |

Perintah pengecekan:

```bash
npm run format:check
npm run lint:check
npm run types:check
npm run build
php artisan test
./vendor/bin/pint --test
```
