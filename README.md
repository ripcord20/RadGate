# RadGate

Sistem billing dan manajemen jaringan untuk ISP / RT-RW Net. Dibangun dari nol dengan
arsitektur multi-tenant SaaS: satu instalasi melayani banyak operator, masing-masing
dengan wilayah, paket, pelanggan, dan kuota langganannya sendiri.

## Status

Modul bisnis sudah punya API dan UI CRUD: pelanggan, tagihan, keuangan, inventory,
jaringan (NAS/Mikrotik stub), hotspot, tiket, reseller, WhatsApp (gateway stub),
laporan, payment gateway (provider stub), dan langganan platform.

Integrasi perangkat sungguhan belum dipasang di VPS billing: FreeRADIUS, GenieACS,
gateway WhatsApp Baileys, tile peta, dan portal pelanggan tetap layanan terpisah.

Pasang di VPS mengikuti [`docs/06-deployment.md`](./docs/06-deployment.md). Pembaruan
kode: `scripts/deploy.sh`.

## Menjalankan

```bash
npm install
npm run build --workspace @radgate/shared   # backend memakai hasil build paket ini
npm run dev                                 # frontend di http://localhost:5173
npm run dev:api                             # backend di http://localhost:3000/v1
```

Backend butuh PostgreSQL dan Redis. Lihat [`apps/api/README.md`](./apps/api/README.md).

## Struktur

```
apps/web        SPA admin: React 19 + Vite + Tailwind + shadcn/ui
apps/api        REST API: NestJS + Prisma + PostgreSQL
packages/shared Tipe, enum, dan skema Zod yang dipakai kedua sisi
docs            Blueprint desain
```

Skema Zod tinggal di `packages/shared` dan dipakai dua kali: sebagai resolver
react-hook-form di frontend, dan sebagai validation pipe di backend. Satu definisi,
sehingga aturan validasi tidak bisa berbeda antara keduanya.

## Dokumen

| Dokumen | Isi |
| --- | --- |
| [`docs/01-arsitektur.md`](./docs/01-arsitektur.md) | Pembagian layanan, tech stack, empat lapis lintas-modul |
| [`docs/02-modul.md`](./docs/02-modul.md) | 16 modul, route, kolom tabel, aksi, dan filter |
| [`docs/03-api.md`](./docs/03-api.md) | Kontrak REST API per modul |
| [`docs/04-database.md`](./docs/04-database.md) | Skema tabel dan relasi |
| [`docs/05-roadmap.md`](./docs/05-roadmap.md) | Urutan pengerjaan bertahap |
| [`docs/06-deployment.md`](./docs/06-deployment.md) | Ubuntu, RAM/CPU, PostgreSQL, systemd, Nginx |

Mulai dari `docs/01-arsitektur.md`. Bagian "Empat lapis lintas-modul" menjelaskan kenapa
kontrol akses, scoping wilayah, antrean job, dan kuota langganan dikerjakan sebelum modul
pertama, bukan sesudahnya. Cara memasang di VPS ada di `docs/06-deployment.md`; skrip
pembaruan ada di `scripts/deploy.sh`.

## Empat lapis yang menopang semuanya

1. **Kontrol akses per peran** — `owner`, `admin`, `teknisi`, `reseller`, `biller`. Guard
   backend menegakkan, frontend hanya menyembunyikan.
2. **Scoping wilayah** — wilayah adalah batas otorisasi, bukan kolom kategori. Diterapkan
   sebagai scope otomatis di lapisan repository, bukan `WHERE` yang ditulis manual.
3. **Antrean job** — sinkronisasi Mikrotik, broadcast WhatsApp, generate tagihan, dan
   import Excel berjalan sebagai job, bukan menyandera request HTTP.
4. **Kuota langganan** — diperiksa di backend sebelum operasi pembuatan; frontend hanya
   menampilkan bar progresnya.

## Tech stack

**Frontend** React 19, Vite, TypeScript, Tailwind CSS v4, shadcn/ui (Radix), TanStack
Query, Axios, react-hook-form, Zod, Recharts, Leaflet, Sonner, date-fns.

**Backend** NestJS, Prisma, PostgreSQL, Redis (BullMQ), Argon2id, JWT.

Setiap route di frontend di-`lazy()` tanpa kecuali, dan Vite memecah vendor chunk yang
berat. Hasilnya chunk login sekitar 39 kB, bukan satu bundel yang memuat seluruh aplikasi
hanya untuk menampilkan layar login.

## Lisensi

Belum ditentukan.
