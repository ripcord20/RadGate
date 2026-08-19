# Arsitektur

## Pembagian layanan

Sistem dipecah jadi lima layanan terpisah, bukan satu monolit. Alasannya bukan
gaya-gayaan: tiga di antaranya punya karakter beban yang sangat berbeda dari admin
portal, sehingga kalau digabung akan saling menjatuhkan.

| Layanan | Subdomain | Isi | Kenapa dipisah |
| --- | --- | --- | --- |
| Admin portal | `app.` | SPA React untuk owner/admin/teknisi | Static file, bisa di-CDN, tidak butuh server state |
| REST API | `api.` | Seluruh logika bisnis + database | Inti sistem, satu-satunya yang menyentuh DB |
| WhatsApp gateway | `whats.` | Koneksi device WA, kirim pesan | Proses long-lived per device, sering crash/reconnect. Kalau jadi satu dengan API, restart WA menjatuhkan billing |
| Portal pelanggan | `client.` | Invoice PDF, halaman bayar | Diakses publik tanpa login. Permukaan serangan berbeda, harus diisolasi dari admin |
| Tile server peta | `maps.` | Tile `{z}/{x}/{y}.png` | Beban I/O besar dan seragam, murah di-cache |

Portal pelanggan penting untuk dipisah sejak awal. Pelanggan membuka link invoice dari
WhatsApp tanpa autentikasi, jadi layanan itu hanya boleh punya akses baca ke satu
invoice lewat token, bukan ke seluruh database.

## Tech stack

### Frontend (`app.`)

React 18 + Vite + TypeScript. UI memakai Tailwind CSS dengan shadcn/ui (komponen Radix
yang di-copy ke dalam repo, bukan dependensi versi-terkunci). Data fetching lewat
TanStack Query di atas Axios. Form pakai react-hook-form dengan skema validasi Zod yang
di-share dengan backend. Grafik pakai Recharts, peta pakai Leaflet, notifikasi toast
pakai Sonner, format tanggal pakai date-fns. Export memakai SheetJS (xlsx), jsPDF untuk
invoice, dan qrcode untuk voucher hotspot.

Satu catatan dari hasil analisis sistem pembanding: bundel mereka mencapai 5,7 MB dalam
satu file karena semua route di-import statis. Semua halaman ikut terunduh hanya untuk
membuka layar login. Di RadGate setiap route harus `React.lazy()` dan Vite dikonfigurasi
memecah vendor chunk, khususnya Leaflet, Recharts, xlsx, dan jsPDF yang jarang dipakai
bersamaan.

### Backend (`api.`)

Rekomendasi: **NestJS + TypeScript + Prisma + PostgreSQL**.

Alasan memilih TypeScript di kedua sisi adalah skema Zod dan tipe DTO bisa dipakai
bersama frontend lewat package `shared/`, sehingga perubahan kontrak API langsung
ketahuan saat compile, bukan saat runtime di produksi. NestJS juga sudah membawa
struktur modul, dependency injection, guard, dan interceptor yang persis cocok dengan
empat lapis lintas-modul di bawah.

Alternatif kalau tim lebih kuat di PHP: Laravel + Sanctum + Eloquent. Pola modul/action
yang dipakai sistem pembanding memang khas PHP dan tetap sah, tapi kehilangan tipe
bersama antara frontend dan backend.

### Pendukung

Redis untuk antrean job (BullMQ) dan cache. PostgreSQL sebagai database utama; pilih
PostgreSQL daripada MySQL karena modul Pemetaan butuh query geospasial (PostGIS) dan
modul Devices menyimpan data telemetri ONT yang cocok dengan tipe JSONB.

## Empat lapis lintas-modul

Ini bagian terpenting dari desain. Pada sistem pembanding, setiap halaman tanpa kecuali
memanggil enam endpoint yang sama sebelum memuat datanya sendiri. Artinya keempat lapis
berikut bukan fitur tambahan, melainkan fondasi yang harus ada sebelum modul pertama
ditulis. Menambahkannya belakangan berarti membongkar setiap query dan setiap komponen.

### 1. Kontrol akses per peran

Peran yang ada: `owner`, `admin`, `teknisi`, `reseller`, `biller`.

Frontend mengambil peta izin sekali saat login dan menyimpannya di context. Setiap
tombol aksi dan setiap item menu dirender bersyarat berdasarkan peta itu. Backend
memverifikasi ulang izin yang sama di setiap endpoint lewat guard, karena kontrol di
frontend hanya kosmetik.

### 2. Scoping wilayah

Hampir setiap layar punya filter "Semua Wilayah". Wilayah bukan sekadar kolom
kategori, melainkan batas otorisasi: seorang teknisi wilayah Lateng tidak boleh melihat
pelanggan wilayah Ketapang.

Konsekuensi desain: kolom `wilayah_id` wajib ada di tabel pelanggan, tagihan, transaksi
keuangan, inventory, NAS, Mikrotik, ODP, reseller, dan tiket. Filter wilayah diterapkan
di lapisan repository sebagai scope global yang otomatis, bukan sebagai `WHERE` yang
ditulis manual di tiap query. Sekali saja lupa menulisnya, terjadi kebocoran data
antar wilayah.

### 3. Antrean job latar belakang

Dipakai untuk sinkronisasi Mikrotik, broadcast WhatsApp massal, generate tagihan
bulanan, import pelanggan dari Excel, dan polling perangkat ONT.

Operasi ini bisa berjalan menit hingga jam dan tidak boleh menyandera request HTTP.
Frontend memantau progres lewat polling endpoint daftar job. Setiap job menyimpan
status, progres, dan pesan error agar bisa ditampilkan dan diulang.

### 4. Kuota langganan

Setiap tenant punya batas terukur pada paket langganannya. Angka nyata yang terlihat di
sistem pembanding: pelanggan 621/1000, NAS 3/24, Mikrotik 3/24, voucher hotspot
0/50.000.

Kuota diperiksa di backend sebelum operasi pembuatan, dan sisa kuota dikirim ke frontend
untuk ditampilkan sebagai bar progres di header modul terkait. Ini yang mengubah aplikasi
dari alat internal menjadi produk SaaS yang bisa dijual berjenjang.

## Autentikasi

Login memakai email dan password dengan proteksi reCAPTCHA v3 untuk menahan credential
stuffing. Server mengembalikan access token berumur pendek dan refresh token. Simpan
refresh token di cookie `HttpOnly` + `Secure` + `SameSite=Strict`, bukan di
`localStorage`, supaya token tidak bisa dicuri lewat XSS.

Setiap request membawa access token di header `Authorization`. Guard di backend
mengekstrak `tenant_id`, `role`, dan daftar `wilayah_id` yang boleh diakses, lalu
menyuntikkannya ke scope repository.

## Integrasi eksternal

| Integrasi | Fungsi |
| --- | --- |
| Mikrotik RouterOS API | Kelola user PPPoE, profil hotspot, sinkronisasi perangkat |
| RADIUS | Autentikasi PPPoE dan hotspot, accounting pemakaian |
| TR-069 / ACS | Telemetri ONT: uptime, PON mode, RX power, suhu |
| Payment gateway (Duitku) | Pembayaran online, callback status, penarikan dana |
| WhatsApp gateway | Reminder tagihan, broadcast, inbox dua arah |

Semua integrasi dibungkus di balik interface. Duitku misalnya jangan dipanggil langsung
dari controller, tapi lewat `PaymentProvider` agar gateway lain bisa ditambahkan tanpa
menyentuh modul tagihan.
