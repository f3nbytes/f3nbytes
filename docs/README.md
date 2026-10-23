# Documentation Index — F3N-Bytes

Dokumentasi proyek website studio F3N-Bytes. Mulai dari
[Overview](./overview/OUTLINE-FEATURES.md) untuk gambaran umum.

## Struktur Dokumentasi

### Outline & Spesifikasi (`overview/`)

| Dokumen | Isi |
| --- | --- |
| [OUTLINE-FEATURES.md](./overview/OUTLINE-FEATURES.md) | Ringkasan produk & modul |
| [PRD.md](./overview/PRD.md) | Spesifikasi produk: fitur, scope, roadmap |
| [ARCHITECTURE.md](./overview/ARCHITECTURE.md) | Desain sistem & pola teknis |
| [GAME-MODULES.md](./overview/GAME-MODULES.md) | Modul game, map Canvas 2D, Phaser, dan realtime |
| [API.md](./overview/API.md) | Referensi route, controller & komponen |
| [DEVELOPMENT.md](./overview/DEVELOPMENT.md) | Workflow & konvensi development |
| [DEPLOYMENT.md](./overview/DEPLOYMENT.md) | Setup produksi |

### Diagram (`flowchart/`)

| Dokumen | Isi |
| --- | --- |
| [flowchart.md](./flowchart/flowchart.md) | Alur bisnis (Mermaid): landing, auth+2FA, settings, lupa password |
| [erd.md](./flowchart/erd.md) | Entity Relationship Diagram database `f3nbytes` (Mermaid) |

## Navigasi Cepat

### Untuk Developer Baru

1. Baca [Overview](./overview/OUTLINE-FEATURES.md) & [PRD](./overview/PRD.md) untuk memahami produk
2. Pelajari [ARCHITECTURE](./overview/ARCHITECTURE.md) untuk memahami sistem
3. Ikuti [DEVELOPMENT](./overview/DEVELOPMENT.md) untuk workflow
4. Lihat [API](./overview/API.md) untuk detail route & komponen
5. Cek [Flowchart](./flowchart/flowchart.md) & [ERD](./flowchart/erd.md) untuk diagram

### Untuk DevOps/Deployment

1. Pahami infrastruktur di [ARCHITECTURE](./overview/ARCHITECTURE.md)
2. Ikuti [DEPLOYMENT](./overview/DEPLOYMENT.md) untuk setup produksi

## Statistik Proyek

| Metrik | Nilai |
| --- | --- |
| Framework | Laravel 13.x |
| Frontend | Inertia React 3 + Tailwind v4 |
| PHP | ^8.3 |
| Database | MySQL/MariaDB |
| Auth | Laravel Fortify (2FA) |
| Bahasa UI | EN (default) / ID / JP |
