# ERD — Database `f3nbytes` (MySQL/MariaDB)

> 9 tabel bawaan Laravel + Fortify. Model aplikasi: `App\Models\User` satu-satunya.
> Lihat juga: [Overview](../overview/OUTLINE-FEATURES.md) · [PRD](../overview/PRD.md) · [Arsitektur](../overview/ARCHITECTURE.md) · [Flowchart](./flowchart.md)
>
> Diagram di bawah memakai Mermaid — tampil otomatis di GitHub/GitLab.

```mermaid
erDiagram
    USERS ||--o{ SESSIONS : "memiliki (user_id, nullable)"
    USERS ||--o| PASSWORD_RESET_TOKENS : "diminta via email"

    USERS {
        bigint id PK
        string name
        string email UK
        datetime email_verified_at "nullable"
        string password "hash"
        string two_factor_secret "nullable, text"
        string two_factor_recovery_codes "nullable, text"
        datetime two_factor_confirmed_at "nullable"
        string remember_token "nullable"
        datetime created_at
        datetime updated_at
    }

    PASSWORD_RESET_TOKENS {
        string email PK
        string token
        datetime created_at "nullable"
    }

    SESSIONS {
        string id PK
        bigint user_id FK "nullable, guest = null"
        string ip_address "nullable"
        text user_agent "nullable"
        longtext payload
        int last_activity "indexed"
    }

    CACHE {
        string key PK
        mediumtext value
        int expiration
    }

    CACHE_LOCKS {
        string key PK
        string owner
        int expiration
    }

    JOBS {
        bigint id PK
        string queue "indexed"
        longtext payload
        tinyint attempts
        int reserved_at "nullable, unsigned"
        int available_at "unsigned"
        int created_at "unsigned"
    }

    JOB_BATCHES {
        string id PK
        string name
        int total_jobs
        int pending_jobs
        int failed_jobs
        longtext failed_job_ids
        mediumtext options "nullable"
        int cancelled_at "nullable"
        int created_at
        int finished_at "nullable"
    }

    FAILED_JOBS {
        bigint id PK
        string uuid UK
        text connection
        text queue
        longtext payload
        longtext exception
        datetime failed_at
    }

    MIGRATIONS {
        int id PK
        string migration
        int batch
    }
```

## Catatan Relasi

- `sessions.user_id → users.id`: nullable — tamu (guest) tercatat dengan `user_id = null`.
- `password_reset_tokens.email → users.email`: relasi logis via email (tanpa FK database).
- `cache`, `cache_locks`, `jobs`, `job_batches`, `failed_jobs`: tabel framework
  (driver `database` untuk CACHE_STORE & QUEUE_CONNECTION) — tidak berelasi ke `users`.
- `migrations`: versi migrasi yang sudah jalan (4 batch: users, cache, jobs, 2FA).
- Tidak ada tabel `projects`: data showcase proyek masih hardcode di
  `resources/js/pages/welcome.tsx` dan `resources/js/pages/projects.tsx`
  (lihat roadmap di [PRD](../overview/PRD.md)).
