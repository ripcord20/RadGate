# Roadmap

Urutan pengerjaan disusun berdasarkan ketergantungan teknis, bukan berdasarkan mana yang
paling menarik. Aturannya: sesuatu dikerjakan lebih dulu kalau membongkarnya belakangan
berarti membongkar pekerjaan lain.

Konsekuensinya, dua tahap pertama tidak menghasilkan layar yang bisa dipamerkan. Itu
disengaja. Empat lapis lintas-modul pada `01-arsitektur.md` menyentuh setiap query dan
setiap komponen, jadi menundanya sampai "nanti kalau sudah jalan" adalah cara termahal
membangun sistem ini.

## Tahap 0 — Fondasi

Belum ada fitur bisnis sama sekali.

- Monorepo: `apps/web`, `apps/api`, `packages/shared` (tipe dan skema Zod bersama)
- Skema database awal: `tenants`, `users`, `permissions`, `wilayah`, `settings`
- Row Level Security PostgreSQL berbasis `tenant_id`
- Autentikasi: login, refresh token di cookie `HttpOnly`, reCAPTCHA v3
- Guard backend yang mengekstrak `tenant_id`, `role`, dan daftar `wilayah_id`
- Scope repository otomatis untuk tenant dan wilayah
- Antrean job (BullMQ + Redis) dengan tabel `tasks`
- App shell frontend: sidebar, context izin, pemilih wilayah, indikator kuota
- CI: lint, typecheck, test, migrasi

**Selesai ketika** seorang teknisi wilayah Lateng login dan secara teknis tidak mampu
melihat data wilayah Ketapang, meskipun ia memanggil API langsung tanpa lewat UI.

## Tahap 1 — Master data

- Modul Wilayah (CRUD, kode singkatan, logo)
- Modul Manajemen Akun (CRUD user, peran, penugasan wilayah)
- Modul Pengaturan (info perusahaan, pajak, kebijakan sistem)
- Modul Paket Internet
- Modul Log (jejak audit)

Modul-modul ini kecil dan seragam. Nilainya bukan pada fiturnya, tapi pada memaksa pola
CRUD, tabel, filter, dan form menjadi baku sebelum dipakai modul yang rumit.

## Tahap 2 — Pelanggan

Inti sistem. Semua modul setelah ini bergantung padanya.

- Daftar pelanggan: 12 kolom, filter wilayah/paket/status/diskon, pengurutan, pencarian
- Form tambah dan ubah pelanggan (4 seksi, ~20 field)
- Detail pelanggan
- Penegakan kuota jumlah pelanggan

Kaitan ke inventory ditunda ke Tahap 6, karena seksi "Inventory Barang Keluar" pada form
membutuhkan modul Inventory. Sampai saat itu seksi tersebut dinonaktifkan.

## Tahap 3 — Tagihan

- Generate tagihan bulanan sebagai job latar belakang
- Daftar tagihan dan detail invoice
- Pencatatan pembayaran tunai, pembayaran bertahap, penandaan hutang
- Perhitungan pajak dan diskon
- Invoice PDF

Batasan unik `(tenant_id, customer_id, period_month, period_year)` harus ada sejak awal
tahap ini. Itulah yang membuat generate tagihan idempoten, sehingga menjalankannya dua
kali tidak melahirkan tagihan ganda.

## Tahap 4 — Keuangan & laporan

- Kategori dan transaksi keuangan
- Pencatatan otomatis pemasukan dari pembayaran invoice
- Job snapshot agregat harian
- Modul Laporan (4 tab) yang membaca snapshot, bukan memindai tabel mentah
- Export Excel dan PDF

## Tahap 5 — Jaringan

Tahap dengan risiko tertinggi karena bergantung pada perangkat fisik.

- Modul NAS dan Port Forwarding
- Integrasi Mikrotik RouterOS API, sinkronisasi sebagai job
- Provisioning user PPPoE otomatis saat pelanggan dibuat
- RADIUS untuk autentikasi dan accounting
- Riwayat sesi dan deteksi anomali login

Bungkus RouterOS API di balik interface dan sediakan implementasi tiruan. Tanpa itu,
pengembangan dan pengujian tahap ini menjadi mustahil tanpa perangkat sungguhan.

## Tahap 6 — Inventory & lapangan

- Modul Inventory (barang, stok, log transaksi)
- Sambungkan seksi barang keluar pada form pelanggan
- Modul Tiket dengan penugasan teknisi
- Modul Pemetaan: ODP, penanda pelanggan, Leaflet

Perubahan stok wajib berada dalam transaksi database yang sama dengan pembuatan
pelanggan. Kalau tidak, stok tercatat akan menyimpang dari stok sebenarnya dan selisihnya
tidak bisa direkonsiliasi.

## Tahap 7 — WhatsApp & notifikasi

- Layanan gateway terpisah (`whats.`)
- Template pesan dengan variabel
- Broadcast massal sebagai job dengan pembatasan laju
- Reminder tagihan terjadwal
- Inbox dua arah
- Pusat notifikasi

Batasi laju pengiriman secara agresif. Broadcast tanpa jeda adalah cara tercepat membuat
nomor WhatsApp diblokir, dan nomor yang diblokir menghentikan seluruh alur reminder.

## Tahap 8 — Pembayaran online

- Layanan portal pelanggan (`client.`) dengan akses berbasis token
- Integrasi Duitku di balik interface `PaymentProvider`
- Callback status pembayaran yang idempoten
- Pelacakan penarikan dana

Callback gateway bisa datang berkali-kali untuk satu transaksi. Tangani dengan kunci
idempoten sejak awal, jangan diperbaiki setelah ada pembayaran ganda.

## Tahap 9 — Hotspot

- Profil hotspot
- Generate voucher massal dengan `batch_id`
- Cetak voucher dengan QR
- Rekap penjualan dan sesi

## Tahap 10 — Reseller & AO

- Reseller dan Biller, skema komisi, buku saldo
- Account Officer dan penugasan pelanggan
- Speed on Demand

## Tahap 11 — Langganan platform

- Paket langganan dan kuota
- Penghitung pemakaian
- Tagihan dan pembayaran langganan tenant

Diletakkan terakhir karena penegakan kuotanya sudah dipasang sejak Tahap 0. Yang
tersisa di sini hanyalah antarmuka pengelolaan dan penagihannya.

## Yang dikerjakan setelahnya

Telemetri ONT lewat TR-069/ACS, aplikasi mobile pelanggan, dan aplikasi admin mobile.
Ketiganya bergantung pada API yang sudah mantap, jadi tidak masuk akal dikerjakan
sebelum tahap-tahap di atas selesai.

## Prinsip yang berlaku sepanjang jalan

**Kuota diperiksa di backend.** Pemeriksaan di frontend hanya untuk menampilkan bar
progres, dan bisa dilewati siapa pun yang memanggil API langsung.

**Integrasi eksternal selalu di balik interface.** Duitku, Mikrotik, dan WhatsApp akan
berubah atau diganti. Modul bisnis tidak boleh tahu nama vendornya.

**Setiap operasi panjang adalah job.** Kalau sebuah aksi bisa berjalan lebih dari
beberapa detik, ia masuk antrean, bukan menyandera request HTTP.

**Uang tidak pernah `FLOAT`.** `BIGINT` dalam satuan rupiah penuh, tanpa perkecualian.
