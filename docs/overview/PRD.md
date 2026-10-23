# PRD — F3N-Bytes Studio Website

> Product Requirements Document. Status: v1.0 — sesuai implementasi saat ini.
> Lihat juga: [Overview](./OUTLINE-FEATURES.md) · [ERD](../flowchart/erd.md) · [Arsitektur](./ARCHITECTURE.md) · [Flowchart](../flowchart/flowchart.md)

## 1. Ringkasan Produk

Website studio tim developer muda **F3N-Bytes** (Fahri, Fadlan, Farrel, Nathan).
Fungsi utama: company profile / personal branding tim + showcase proyek + fondasi
member area (autentikasi + dashboard + pengaturan akun).

- Tagline: "Built by passion, powered by bytes."
- Misi: "Grow together, build something bigger."
- Bahasa: Inggris (default), Indonesia, Jepang — bisa diganti dari navbar.
- Tema: **terang sebagai default**, bisa toggle Terang/Gelap (tersimpan di
  localStorage + cookie, terbaca juga oleh server).

## 2. Target Pengguna

| Segmen | Kebutuhan |
| --- | --- |
| Klien / calon partner | Melihat profil tim, proyek, kontak |
| Rekruter / sekolah (UKK) | Bukti skill: portofolio + project build |
| Anggota tim (member) | Login, kelola profil & keamanan akun |

## 3. Scope Fitur (saat ini)

### 3.1 Publik (tanpa login)

| Halaman | Route | Isi |
| --- | --- | --- |
| Landing | `GET /` | Loading boot-sequence, hero + panel `team.kernel.ts`, About, Team (4 anggota + skill + GitHub/portofolio), Projects (4 proyek), Tech Stack, Statistik, Contact, footer |
| Semua Proyek | `GET /projects` | Showcase detail 4 proyek: OceanResto, UKK Project, WhatsApp Bot, Portfolio Website + statistik |
| Auth | Fortify | Login, register, lupa/reset password, verifikasi email, konfirmasi password, 2FA challenge |

### 3.2 Member (login + email terverifikasi)

| Halaman | Route | Isi |
| --- | --- | --- |
| Dashboard | `GET /dashboard` | Placeholder grid (siap diisi konten) |
| Profil | `GET/PATCH /settings/profile`, `DELETE /settings/profile` | Edit nama/email, hapus akun |
| Keamanan | `GET /settings/security`, `PUT /settings/password` (throttle 6/menit) | Ganti password, setup 2FA (OTP + recovery codes) |
| Tampilan | `GET /settings/appearance` | Pilih tema Terang/Gelap |

### 3.3 Autentikasi & Keamanan (Laravel Fortify)

- Registrasi + login email/password, remember-me (remember token).
- Verifikasi email wajib sebelum akses dashboard & hapus akun.
- Two-Factor Authentication: secret, recovery codes, kolom konfirmasi.
- Session & cache & queue memakai database (bukan file).

## 4. Alur Pengguna Utama

1. **Pengunjung → klien**: buka `/` → scroll (About → Team → Projects → Stack →
   Contact) → hubungi via kontak / buka `/projects` untuk detail.
2. **Member baru**: register → verifikasi email → login → dashboard.
3. **Pengamanan akun**: settings/security → aktifkan 2FA → simpan recovery codes.
4. **Ganti tema/bahasa**: toggle di navbar (tersimpan, default Terang + EN).

## 5. Kebutuhan Non-Fungsional

- Performa: build Vite < 10 dtk, halaman server-render via Inertia (tanpa API terpisah).
- Responsif: mobile (menu hamburger) → desktop.
- Aksesibilitas dasar: label ARIA pada kontrol tema/bahasa/navigasi.
- i18n: 3 bahasa untuk landing (EN/ID/JP), tersimpan di `localStorage:site-language`.
- Lingkungan: PHP ^8.3, MySQL/MariaDB, Node 22+.

## 6. Di Luar Scope (belum ada)

- CRUD proyek dinamis (data proyek masih hardcode di frontend).
- Blog/artikel, CMS admin, upload file publik.
- API publik / mobile, payment, notifikasi real-time.

## 7. Roadmap Usulan

1. Dashboard member terisi (ringkasan proyek, aktivitas tim).
2. Data proyek pindah ke database + halaman admin CRUD.
3. Formulir kontak tersimpan ke DB + notifikasi email.
4. Test otomatis (Pest) untuk auth + settings; CI check hijau.
