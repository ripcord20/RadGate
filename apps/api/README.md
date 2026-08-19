# @radgate/api

REST API RadGate. NestJS + Prisma + PostgreSQL.

## Menjalankan

```bash
cp .env.example .env      # lalu sesuaikan DATABASE_URL dan kedua JWT secret
npm run prisma:migrate    # membuat tabel
npm run dev               # http://localhost:3000/v1
```

Paket `@radgate/shared` harus sudah dibangun lebih dulu, karena API memakai hasil
build-nya lewat `node_modules`, bukan berkas sumbernya. Jalankan `npm run build` dari root
repo yang sudah mengurutkannya, atau `npm run build --workspace @radgate/shared`.

## Yang sudah ada

Fondasi lintas-modul dari Tahap 0 pada [`docs/05-roadmap.md`](../../docs/05-roadmap.md),
yaitu bagian yang mahal kalau ditambahkan belakangan:

| Berkas | Isi |
| --- | --- |
| `common/request-context.ts` | Scope tenant dan wilayah lewat `AsyncLocalStorage` |
| `common/guards.ts` | `AuthGuard` dan `PermissionsGuard`, terpasang global |
| `common/decorators.ts` | `@Public`, `@RequirePermission`, `@CurrentUser` |
| `common/zod-validation.pipe.ts` | Validasi memakai skema Zod yang sama dengan form frontend |
| `prisma/prisma.service.ts` | Koneksi dan `withTenant()` untuk Row Level Security |
| `modules/auth` | Login, refresh token berputar, logout |
| `modules/permissions` | Peta izin per peran, dengan cache pendek |
| `modules/bootstrap` | Satu endpoint untuk seluruh muatan app shell |
| `modules/tasks` | Pendaftaran dan pemantauan job latar belakang |

## Yang belum ada

Modul bisnis: pelanggan, tagihan, keuangan, inventory, jaringan, hotspot, tiket,
reseller, WhatsApp, laporan, dan langganan. Kontraknya sudah dirancang di
[`docs/03-api.md`](../../docs/03-api.md) dan tabelnya di
[`docs/04-database.md`](../../docs/04-database.md). Urutan pengerjaan mengikuti
[`docs/05-roadmap.md`](../../docs/05-roadmap.md).

Skema Prisma saat ini memuat tabel yang sudah disentuh kode ditambah inti
pelanggan-tagihan. Tabel sisanya ditambahkan per tahap, bukan sekaligus di awal.

## Dua hal yang mudah salah

**Guard bawaannya menutup.** `AuthGuard` dan `PermissionsGuard` dipasang lewat `APP_GUARD`
di `app.module.ts`, sehingga endpoint baru otomatis butuh autentikasi. Endpoint publik
harus menyatakannya sendiri dengan `@Public()`. Kalau polanya dibalik, satu endpoint yang
lupa dipasangi guard langsung terbuka ke publik.

**Wilayah adalah batas otorisasi, bukan kolom kategori.** Gunakan `tenantWhere()` dari
`request-context.ts` pada setiap query daftar. Menulis `where` sendiri secara manual
cepat atau lambat akan melewatkan satu query, dan kelalaian itu berarti data satu wilayah
terbaca oleh wilayah lain.
