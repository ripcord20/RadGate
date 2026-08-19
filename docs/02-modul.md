# Modul

16 modul utama, 66 route. Setiap modul di bawah mencantumkan route, kolom tabel, aksi,
dan filter yang perlu dibangun.

Filter yang berulang di hampir semua modul: **Wilayah**, **Status**, dan tombol
**Reset Filter**. Perlakukan itu sebagai komponen `<FilterBar>` bersama, bukan
diduplikasi 16 kali.

---

## 1. Dashboard

`/dashboard`

Layar ringkasan. Terdiri dari empat baris kartu statistik dan tiga blok analitik.

**Kartu statistik**

| Kelompok | Metrik |
| --- | --- |
| Pelanggan | Total, Online, Offline, Expired, Berhenti |
| Tiket bulan ini | Total, Baru, Dalam Proses, Selesai |
| Tagihan bulan ini | Total, Sudah Bayar, Belum Bayar, Terlambat |

**Blok analitik**

- Analisis Keuangan — pendapatan, pengeluaran, dan profit untuk bulan berjalan serta
  year-to-date, ditemani grafik batang per bulan
- Analisis Pelanggan — total aktif, pelanggan baru YTD, pelanggan baru bulan ini
  dibanding bulan lalu, grafik pertumbuhan, dan distribusi paket
- Lokasi Pelanggan — peta Leaflet dengan filter wilayah dan status online/offline,
  bisa disembunyikan

**Pemilihan server default** Monitoring realtime baru aktif setelah pengguna menetapkan
satu NAS sebagai default. Sebelum itu, tampilkan panel ajakan memilih server.

---

## 2. Pelanggan

| Route | Halaman |
| --- | --- |
| `/customers` | Daftar semua pelanggan |
| `/customers/add` | Form tambah |
| `/customers/edit/:id` | Form ubah |
| `/customers/detail/:id` | Detail |
| `/customers/anomali-login` | Anomali login |
| `/customers/devices` | Perangkat ONT |
| `/customers/packages` | Paket internet |
| `/customers/speed-on-demand` | Speed on demand |
| `/customers/layanan` | Layanan |

### Daftar pelanggan

Kolom: Pelanggan (sortir), Status, Paket & IP, Aktivitas (sortir), ODP, Alamat (sortir),
Telepon, Terakhir Bayar, Jatuh Tempo (sortir), Instalasi (sortir), Wilayah, Aksi.

Kolom Status menampung tiga indikator sekaligus dalam satu sel: status aplikasi, status
koneksi (online/offline), dan status ACS. Kolom Aktivitas menampilkan durasi uptime plus
angka upload dan download.

Aksi per baris: Remote, Detail, Edit. Aksi massal: EXPIRED, BERHENTI, Import.

Filter: Diskon, Paket, Status, Kelengkapan, Wilayah, Reseller, ditambah pencarian bebas
untuk nama, alamat, username, dan catatan.

Header modul menampilkan pemakaian kuota pelanggan terhadap batas paket langganan.

### Form tambah pelanggan

Empat seksi:

**Layanan Internet** — Username PPPoE (wajib), Password PPPoE (wajib), Paket Internet
(wajib, pencarian), Pengaturan IP (DHCP atau statis)

**Akun Aplikasi** — Email (wajib), Password (wajib). Ini kredensial pelanggan untuk
aplikasi mobile, terpisah dari kredensial PPPoE.

**Informasi Personal** — Nama Lengkap (wajib), Nomor Telepon (wajib, diawali 62), NIK
(wajib), Alamat Lengkap (wajib), Reseller (opsional), Tipe Penagihan
(prepaid/postpaid), Tanggal Instalasi, Tanggal Jatuh Tempo, Biaya Pasang, Diskon (Rp),
ODP (opsional), Catatan, Latitude, Longitude

**Inventory Barang Keluar** (wajib) — pilih barang dan stok yang dipakai saat instalasi.
Seksi ini mengaitkan pemasangan pelanggan dengan pengurangan stok gudang secara
otomatis, sehingga stok tidak perlu dicatat manual dua kali.

### Perangkat (ONT)

Kolom: Username, Info Perangkat, IP & Status, Layanan, Uptime, Pon Mode, RX Power, Suhu,
Informasi Terakhir, Aksi.

Ringkasan agregat: total perangkat, distribusi kualitas RX (Bagus / Cukup / Lemah),
distribusi mode PON (GPON / EPON), dan distribusi merek (ZTE, FiberHome, CIOT, Huawei,
ZICG).

Data diambil lewat TR-069/ACS. Klasifikasi RX Power memakai ambang batas dBm yang harus
bisa dikonfigurasi, bukan di-hardcode, karena tiap operator punya toleransi berbeda.

### Paket internet

Tampilan kartu, bukan tabel. Tiap kartu memuat nama paket, kecepatan, harga, dan jumlah
pelanggan yang memakainya. Filter status dan wilayah.

### Anomali login

Mendeteksi pola login mencurigakan pada akun pelanggan, misalnya satu kredensial PPPoE
dipakai dari beberapa lokasi. Berguna untuk menangkap penyalahgunaan akun.

### Speed on demand

Menaikkan kecepatan sementara di luar paket dasar, dengan masa berlaku. Dijual sebagai
layanan tambahan.

---

## 3. Hotspot

| Route | Halaman |
| --- | --- |
| `/hotspot` | Daftar voucher |
| `/hotspot/profile` | Profil hotspot |
| `/hotspot/rekap` | Rekap pemakaian |
| `/hotspot/embed/:id` | Halaman voucher untuk disematkan |

Voucher menampilkan total, jumlah online, dan pemakaian kuota terhadap batas langganan.

Aksi: Single (buat satu voucher), Generate (buat massal), Import, Domain Hotspot.
Filter: Wilayah, Reseller, Paket, Status.

Profil hotspot memetakan paket voucher ke profil Mikrotik: batas kecepatan, durasi, dan
kuota data. Halaman embed dipakai reseller untuk menjual voucher lewat halaman sendiri.

Voucher dicetak dengan QR code agar pelanggan tidak perlu mengetik kode manual.

---

## 4. Tagihan

| Route | Halaman |
| --- | --- |
| `/billing` | Daftar tagihan |
| `/billing/generate` | Generate tagihan |
| `/billing/detail/:id` | Detail tagihan |
| `/ao` | Account Officer |
| `/ao/active` | AO aktif |
| `/ao/detail/:id` | Detail AO |

### Daftar tagihan

Kolom: ID Invoice, Pelanggan (sortir), Wilayah, Jumlah (sortir), Paket, Metode, Status,
Jatuh Tempo / Periode / Paid / Acc By, Aksi.

Kolom terakhir memadatkan empat informasi: kapan jatuh tempo, periode tagihan, kapan
dibayar, dan siapa yang menyetujui pembayaran. Jejak persetujuan itu penting saat
pembayaran diterima tunai oleh kolektor.

Ringkasan header: jumlah pending, jumlah terlambat, nilai hutang, dan nilai total.

Aksi: Generate Tagihan, Bayar / Hutang, Reminder, Belum Bayar.
Filter: Status, Periode, Tahun, Wilayah, Reseller.

Nomor invoice memakai format berurutan `INV-####`.

### Generate tagihan

Membuat tagihan massal untuk satu periode. Jalankan sebagai job latar belakang dengan
laporan progres, karena ribuan pelanggan tidak bisa diproses dalam satu request.

Wajib idempoten: menjalankan generate dua kali untuk periode yang sama tidak boleh
menghasilkan tagihan ganda.

### Account Officer

Penugasan petugas penagihan ke sekumpulan pelanggan, lengkap dengan nilai tagihan yang
dipegang tiap petugas. Filter status dan wilayah.

---

## 5. Payment Gateway

`/payment-gateway`

Blok ringkasan: Total Transaksi & Nominal, Pending & Sudah Tarik Dana, Distribusi
Wilayah (Belum Tarik Dana), Distribusi Wilayah (Sudah Tarik Dana), lalu tabel transaksi.

Aksi: Sejarah Penarikan. Filter: Tipe, Metode pembayaran, Wilayah, rentang tanggal.

Pembedaan "sudah tarik dana" dan "belum tarik dana" adalah inti modul ini: uang yang
sudah dibayar pelanggan belum tentu sudah masuk rekening operator, dan selisih itu harus
terlihat per wilayah untuk rekonsiliasi.

Integrasi Duitku dikonfigurasi di modul Pengaturan, dengan pilihan mode Sandbox dan
Production.

---

## 6. Tiket

| Route | Halaman |
| --- | --- |
| `/tiket` | Daftar tiket |
| `/tiket/buat` | Buat tiket |
| `/tiket/detail/:id` | Detail tiket |

Tab status: Baru, Dalam Proses, Selesai, Semua.

Aksi: Buat Tiket, Export, Auto-Refresh. Filter: Teknisi, Prioritas.

Auto-refresh perlu karena layar ini dipakai sebagai papan pantau operasional yang
dibiarkan terbuka. Tiket terhubung ke pelanggan dan ditugaskan ke teknisi, dengan
riwayat komentar di halaman detail.

---

## 7. Reseller & Biller

| Route | Halaman |
| --- | --- |
| `/reseller` | Daftar reseller dan biller |
| `/reseller/pelanggan` | Pelanggan milik reseller |
| `/reseller/log` | Log aktivitas |
| `/reseller/pay` | Pembayaran reseller |

Tab: Reseller, Biller. Filter: Wilayah, Tipe, Status.

Reseller menjual layanan dan mendapat bagi hasil; biller hanya menagih. Keduanya berbagi
tabel yang sama dengan pembeda kolom tipe. Pelanggan boleh terhubung ke satu reseller,
dan komisi dihitung dari tagihan pelanggan tersebut.

---

## 8. Keuangan

`/finances`

Kartu: Total Pendapatan, Total Pengeluaran, Profit — untuk bulan berjalan, ditemani
grafik dan tabel transaksi.

Aksi: Tambah Transaksi, Kelola Kategori. Filter: jenis transaksi, kategori, bulan, tahun,
wilayah.

Kategori pemasukan dan pengeluaran dikelola pengguna, tidak di-hardcode. Pembayaran
tagihan pelanggan harus otomatis tercatat sebagai pemasukan di modul ini supaya laporan
keuangan tidak perlu direkap ulang.

---

## 9. Pemetaan

`/pemetaan`

Peta jaringan berbasis Leaflet dengan tile server sendiri. Menampilkan ODP dan lokasi
pelanggan.

Aksi: Panel Jaringan, Kontrol Layer, Mode Peta (Standard / Satelit), Statistik, Export,
Reset.

Kontrol layer memungkinkan menyalakan dan mematikan lapisan secara terpisah: ODP,
pelanggan, dan jalur kabel. Karena jumlah titik bisa ribuan, gunakan clustering marker
agar peta tetap responsif.

---

## 10. Inventory

`/inventory`

Tab: Barang & Stok, Log Transaksi.

Kolom barang: Kode, Nama Barang, Kategori, Unit, Stok, Deskripsi, Aksi.

Aksi: Tambah Barang, Tambah Stok, Barang Keluar, Export Stok, Detail.
Filter: Wilayah, Reseller. Ringkasan: Total Assets.

Log transaksi mencatat setiap mutasi stok masuk dan keluar. Pemasangan pelanggan baru
otomatis membuat entri barang keluar lewat seksi inventory di form tambah pelanggan.

---

## 11. Servers

| Route | Halaman |
| --- | --- |
| `/nas` | Daftar NAS |
| `/nas/port-forwarding` | Port forwarding |
| `/mikrotik` | Daftar Mikrotik |
| `/mikrotik/add` | Tambah Mikrotik |
| `/mikrotik/edit/:id` | Ubah Mikrotik |

Keduanya bertampilan kartu yang dikelompokkan per wilayah, menampilkan total perangkat,
jumlah online, dan pemakaian kuota terhadap batas langganan.

Aksi NAS: Tambah, Migrasi, Lihat Detail. Aksi Mikrotik: Tambah, Sync Semua, per-perangkat
sync.

Migrasi memindahkan sekumpulan pelanggan dari satu NAS ke NAS lain, dipakai saat
menambah kapasitas atau mengganti perangkat. Sinkronisasi berjalan sebagai job latar
belakang karena menyentuh perangkat lewat jaringan yang bisa lambat atau mati.

Kredensial Mikrotik wajib dienkripsi saat disimpan (lihat `docs/04-database.md`).

---

## 12. Pusat Notifikasi

`/notifications-center`

Mendaftarkan perangkat yang menerima notifikasi push dan menyimpan riwayat notifikasi
terkirim. Dipakai untuk memberi tahu admin soal perangkat mati, tagihan jatuh tempo, dan
tiket baru.

---

## 13. WhatsApp

| Route | Halaman |
| --- | --- |
| `/whatsapp` | External API |
| `/whatsapp/internal` | Gateway internal |
| `/whatsapp/broadcast` | Daftar broadcast |
| `/whatsapp/broadcast/new` | Buat broadcast |
| `/whatsapp/template` | Template pesan |
| `/whatsapp/inbox/:number` | Percakapan |

Dua jalur pengiriman. **Internal** memakai device WA milik sendiri yang dipasangkan lewat
QR, dengan batas pemakaian. **External API** menyambung ke penyedia pihak ketiga.

Template pesan mendukung variabel seperti nama pelanggan, nominal tagihan, dan tanggal
jatuh tempo, dipakai untuk reminder otomatis dari modul Tagihan.

Broadcast dieksekusi sebagai job latar belakang dengan jeda antar pesan supaya nomor
tidak diblokir.

---

## 14. Laporan

`/reports`

Tab: Rekap, Pelanggan, Keuangan, Tagihan.

Seksi: Ringkasan Keseluruhan, Ringkasan Pelanggan, Ringkasan Keuangan, Kategori
Pendapatan, Kategori Pengeluaran, Ringkasan Tagihan, Ringkasan per Metode Pembayaran,
Ringkasan Inventory, Ringkasan Hotspot, Metrik Performa Hotspot, Metrik Utama.

Filter rentang tanggal dan wilayah, dengan tombol Export.

Laporan sebaiknya dihitung dari tabel agregat harian, bukan dengan memindai tabel
transaksi mentah setiap kali dibuka. Tanpa itu, halaman ini akan makin lambat seiring
data bertambah.

---

## 15. Pengaturan

| Route | Halaman |
| --- | --- |
| `/settings` | Pengaturan aplikasi |
| `/settings/import` | Import data |
| `/settings/import/excel` | Import dari Excel |
| `/settings/export` | Export data Mikrotik |
| `/wilayah` | Wilayah |
| `/accounts` | Manajemen akun |
| `/apppelanggan` | Aplikasi pelanggan |
| `/log` | Log aktivitas |

**Pengaturan aplikasi** — Informasi Aplikasi, Informasi Perusahaan, Pengaturan Pajak,
Pengaturan Sistem & Kebijakan, Integrasi Pembayaran Duitku, Import & Export Pelanggan,
serta penggantian logo.

**Wilayah** — tiap wilayah punya nama, kode singkat (MDR, LTG, KRJO), dan logo sendiri.
Bisa dinonaktifkan tanpa dihapus. Kode wilayah dipakai sebagai awalan ID pelanggan.

**Manajemen akun** — kolom Nama, Email, Telepon, Wilayah, Peran, Mode, Aksi. Satu akun
diikat ke wilayah tertentu, dan itulah yang menegakkan pembatasan akses per wilayah.

**Aplikasi pelanggan** — konfigurasi aplikasi mobile pelanggan: branding, tautan unduh,
dan fitur yang diaktifkan.

**Log** — jejak audit seluruh aksi pengguna.

---

## 16. Langganan Saya

| Route | Halaman |
| --- | --- |
| `/subscription` | Ikhtisar |
| `/subscription/status` | Status langganan |
| `/subscription/plans` | Paket langganan |
| `/subscription/billing-history` | Riwayat tagihan |
| `/subscription/bill/:id` | Detail tagihan langganan |
| `/subscription/payment/:id` | Pembayaran |
| `/subscription/confirm` | Konfirmasi |

Modul ini adalah billing untuk operator itu sendiri, bukan untuk pelanggan internet.
Di sinilah RadGate menagih tenant atas pemakaian platform.

Kuota yang ditegakkan: jumlah pelanggan, jumlah NAS, jumlah Mikrotik, jumlah voucher
hotspot, dan pemakaian pesan WhatsApp.

---

## Route publik

| Route | Halaman |
| --- | --- |
| `/login` | Login |
| `/register` | Daftar akun baru |
| `/forgot-password` | Lupa password |
| `/reset-password` | Reset password |
| `/profile` | Profil saya |
| `/profile/edit` | Ubah profil |
