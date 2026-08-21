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

Fondasi lintas-modul dari Tahap 0, plus modul bisnis (pelanggan sampai langganan).
Lihat README di root repo untuk daftar lengkap.

## Data awal

```bash
npx prisma migrate deploy
npx prisma db seed
```

Login pengembangan: `owner@radgate.local` / `RadGate.dev1`. Ganti password setelah masuk.
Ubah lewat `SEED_OWNER_EMAIL` dan `SEED_OWNER_PASSWORD` jika perlu.

## Yang belum ada di mesin ini

Integrasi perangkat sungguhan: RouterOS, FreeRADIUS, Baileys, Duitku, portal pelanggan,
dan GenieACS. Itu layanan terpisah, bukan kekurangan skema di API billing.

## Dua hal yang mudah salah

**Guard bawaannya menutup.** `AuthGuard` dan `PermissionsGuard` dipasang lewat `APP_GUARD`
di `app.module.ts`, sehingga endpoint baru otomatis butuh autentikasi. Endpoint publik
harus menyatakannya sendiri dengan `@Public()`. Kalau polanya dibalik, satu endpoint yang
lupa dipasangi guard langsung terbuka ke publik.

**Wilayah adalah batas otorisasi, bukan kolom kategori.** Gunakan `tenantWhere()` dari
`request-context.ts` pada setiap query daftar. Menulis `where` sendiri secara manual
cepat atau lambat akan melewatkan satu query, dan kelalaian itu berarti data satu wilayah
terbaca oleh wilayah lain.
