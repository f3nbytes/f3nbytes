# Flowchart — F3N-Bytes Studio Website

> Kumpulan alur utama (Mermaid — tampil otomatis di GitHub/GitLab).
> Lihat juga: [Overview](../overview/OUTLINE-FEATURES.md) · [PRD](../overview/PRD.md)

## 1. Pengunjung → Landing → Kontak

```mermaid
flowchart TD
    A[Buka /] --> B{Tema tersimpan?}
    B -- Tidak ada --> C[Default: Terang]
    B -- Ada --> D[Terapkan simpanan]
    C --> E[Landing: hero, about, team, projects, stack, stats, contact]
    D --> E
    E --> F{Pilih bahasa?}
    F -- EN/ID/JP --> G[Konten landing ganti bahasa]
    G --> H{Klik?}
    H -- Explore Projects --> I[/projects: detail 4 proyek/]
    H -- Meet Team --> J[#team]
    H -- Contact --> K[#contact: Discord, GitHub, Instagram, Email]
    I --> K
```

## 2. Register → Verifikasi → Login (+ 2FA)

```mermaid
flowchart TD
    A[/register/] --> B[Isi nama, email, password]
    B --> C{Kirim?}
    C -- Gagal validasi --> B
    C -- OK --> D[Akun dibuat + email verifikasi dikirim]
    D --> E{Klik link verifikasi?}
    E -- Belum --> F[Akses dashboard ditolak]
    E -- Sudah --> G[/login/]
    G --> H{Kredensial benar?}
    H -- Salah --> G
    H -- Benar --> I{2FA aktif?}
    I -- Ya --> J[Tantangan kode OTP / recovery]
    J -- Salah --> J
    J -- Benar --> K[Login sukses → /dashboard]
    I -- Tidak --> K
```

## 3. Settings Member

```mermaid
flowchart TD
    A[Login + verified] --> B[/settings → /settings/profile/]
    B --> C{Tab?}
    C -- Profile --> D[Edit nama/email + hapus akun]
    C -- Security --> E[Ganti password throttle 6/mnt + setup 2FA]
    C -- Appearance --> F[Pilih Terang/Gelap → tersimpan + cookie]
    D --> G[Konfirmasi password untuk aksi sensitif]
    E --> G
```

## 4. Lupa Password

```mermaid
flowchart TD
    A[/forgot-password/] --> B[Input email terdaftar]
    B --> C[Token reset tersimpan + link dikirim]
    C --> D[/reset-password?token=.../]
    D --> E{Token valid?}
    E -- Tidak --> A
    E -- Ya --> F[Password baru disimpan]
    F --> G[/login/]
```
