# Outline Fitur — F3N-Bytes Studio Website

> Ringkasan produk & modul. Detail: [PRD](./PRD.md) · [ERD](../flowchart/erd.md) ·
> [Arsitektur](./ARCHITECTURE.md) · [Flowchart](../flowchart/flowchart.md)

## Apa ini?

Website studio tim developer muda **F3N-Bytes** — gabungan company profile,
showcase proyek, dan member area. Tagline: *"Built by passion, powered by
bytes."* Misi: *"Grow together, build something bigger."*

## Sekilas Angka

| Aspek | Isi |
| --- | --- |
| Anggota tim | 4 (Fahri — Frontend/UI, Nathan — Backend, Farrel — Fullstack, Fadlan — UI/UX & Analyst) |
| Proyek showcase | 4 (OceanResto, UKK Project, WhatsApp Bot, Portfolio Website) |
| Bahasa landing | 3 (EN/ID/JP) |
| Tema | Terang (default) / Gelap, tersimpan per pengguna |
| Halaman | `/` landing, `/projects`, `/dashboard`, `/settings/*`, auth Fortify |
| Database | MySQL `f3nbytes` — 9 tabel, 1 model (`User`) |

## Cara Kerja Singkat

1. **Pengunjung** membuka landing → kenal tim → lihat proyek → hubungi tim.
2. **Member** register → verifikasi email → login (opsional 2FA) → dashboard
   + kelola profil/keamanan/tema di settings.
3. Semua halaman adalah SPA Inertia (Laravel render komponen React,
   tanpa REST API terpisah).

## Status & Berikutnya

Status: fondasi live (landing + auth + settings jadi, dashboard masih
placeholder, data proyek masih hardcode). Berikutnya menurut roadmap PRD:
dashboard terisi → proyek pindah ke database + admin CRUD → form kontak
tersimpan + email → test otomatis & CI hijau.
