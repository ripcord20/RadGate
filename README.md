# RadGate

Sistem billing & manajemen jaringan untuk ISP / RT-RW Net. Dibangun dari nol dengan
arsitektur multi-tenant SaaS: satu instalasi melayani banyak ISP, masing-masing dengan
wilayah, paket, pelanggan, dan kuota langganannya sendiri.

## Status

Tahap blueprint. Dokumen desain lengkap ada di [`docs/`](./docs). Belum ada kode aplikasi.

## Dokumen

| Dokumen | Isi |
| --- | --- |
| [`docs/01-arsitektur.md`](./docs/01-arsitektur.md) | Pembagian layanan, tech stack, empat lapis lintas-modul |
| [`docs/02-modul.md`](./docs/02-modul.md) | 16 modul, route, kolom tabel, aksi, dan filter |
| [`docs/03-api.md`](./docs/03-api.md) | Kontrak REST API per modul |
| [`docs/04-database.md`](./docs/04-database.md) | Skema tabel dan relasi |
| [`docs/05-roadmap.md`](./docs/05-roadmap.md) | Urutan pengerjaan bertahap |

## Tech stack

**Frontend** React 18 + Vite + TypeScript, Tailwind CSS + shadcn/ui, TanStack Query,
Axios, react-hook-form + Zod, Recharts, Leaflet, Sonner.

**Backend** REST API terpisah (lihat `docs/01-arsitektur.md` untuk pilihan runtime),
PostgreSQL, Redis untuk antrean job.

## Lisensi

Belum ditentukan.
