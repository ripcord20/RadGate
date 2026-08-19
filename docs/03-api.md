# Kontrak API

Base URL: `https://api.radgate.example/v1`

## Konvensi

Berbeda dari sistem pembanding yang memakai pola `/<modul>/<action>`, RadGate memakai
REST berbasis resource. Alasannya: pola action membuat setiap fitur baru menambah
endpoint baru, sehingga permukaan API tumbuh tanpa batas dan sulit di-cache maupun
diberi izin secara konsisten.

| Metode | Pola | Arti |
| --- | --- | --- |
| `GET` | `/resource` | Daftar, dengan paginasi |
| `GET` | `/resource/:id` | Satu item |
| `POST` | `/resource` | Buat |
| `PATCH` | `/resource/:id` | Ubah sebagian |
| `DELETE` | `/resource/:id` | Hapus |
| `POST` | `/resource/:id/aksi` | Aksi non-CRUD, misalnya `/mikrotik/:id/sync` |

### Query parameter standar

Berlaku di semua endpoint daftar: `page`, `per_page`, `search`, `sort`, `order`,
`wilayah_id`, `status`, `date_from`, `date_to`.

### Bentuk respons

```json
{
  "data": [],
  "meta": { "page": 1, "per_page": 25, "total": 621, "total_pages": 25 }
}
```

Error memakai bentuk seragam dengan kode HTTP yang sesuai:

```json
{
  "error": { "code": "QUOTA_EXCEEDED", "message": "Batas pelanggan tercapai (1000)", "details": {} }
}
```

---

## Endpoint bootstrap

Dipanggil sekali saat aplikasi dimuat, bukan di setiap perpindahan halaman. Sistem
pembanding memanggil enam endpoint ini di tiap navigasi, yang sepenuhnya mubazir karena
isinya jarang berubah.

| Endpoint | Isi |
| --- | --- |
| `GET /me` | Profil pengguna, peran, wilayah yang boleh diakses |
| `GET /me/permissions` | Peta izin untuk merender menu dan tombol |
| `GET /settings` | Pengaturan tenant |
| `GET /wilayah` | Daftar wilayah untuk komponen filter |
| `GET /subscription/limits` | Kuota dan pemakaian saat ini |
| `GET /tasks?status=running` | Job latar belakang yang sedang berjalan |

Cache di TanStack Query dengan `staleTime` panjang, lalu invalidasi hanya ketika sumbernya
benar-benar berubah.

---

## Autentikasi

| Metode | Endpoint | Keterangan |
| --- | --- | --- |
| `POST` | `/auth/login` | Body: `email`, `password`, `recaptcha_token` |
| `POST` | `/auth/refresh` | Memakai refresh token dari cookie |
| `POST` | `/auth/logout` | Mencabut refresh token |
| `POST` | `/auth/register` | Pendaftaran tenant baru |
| `POST` | `/auth/forgot-password` | Kirim tautan reset |
| `POST` | `/auth/reset-password` | Tetapkan password baru |

---

## Pelanggan

| Metode | Endpoint | Keterangan |
| --- | --- | --- |
| `GET` | `/customers` | Daftar, mendukung seluruh filter standar |
| `POST` | `/customers` | Buat, sekaligus mengurangi stok inventory |
| `GET` | `/customers/:id` | Detail |
| `PATCH` | `/customers/:id` | Ubah |
| `DELETE` | `/customers/:id` | Hapus |
| `GET` | `/customers/summary` | Angka kartu statistik |
| `GET` | `/customers/charts` | Data grafik pertumbuhan dan distribusi paket |
| `POST` | `/customers/bulk/status` | Ubah status massal ke expired atau berhenti |
| `POST` | `/customers/import` | Import Excel, mengembalikan `task_id` |
| `GET` | `/customers/export` | Export |
| `GET` | `/customers/devices` | Daftar perangkat ONT |
| `GET` | `/customers/devices/summary` | Distribusi RX, PON mode, merek |
| `POST` | `/customers/:id/remote` | Buka sesi remote perangkat |
| `GET` | `/customers/anomali-login` | Deteksi anomali login |
| `GET` | `/internet-packages` | Daftar paket |
| `POST` | `/internet-packages` | Buat paket |
| `GET` | `/speed-on-demand` | Daftar langganan speed on demand |
| `POST` | `/speed-on-demand` | Aktifkan untuk satu pelanggan |

---

## Tagihan

| Metode | Endpoint | Keterangan |
| --- | --- | --- |
| `GET` | `/billing` | Daftar tagihan |
| `GET` | `/billing/:id` | Detail |
| `POST` | `/billing/generate` | Generate massal, mengembalikan `task_id` |
| `POST` | `/billing/:id/pay` | Catat pembayaran atau hutang |
| `POST` | `/billing/:id/reminder` | Kirim reminder WhatsApp |
| `GET` | `/billing/summary` | Pending, terlambat, hutang, total |
| `GET` | `/billing/filters` | Opsi filter periode dan tahun |
| `GET` | `/billing/:id/invoice.pdf` | Unduh invoice |
| `GET` | `/ao` | Daftar Account Officer |
| `POST` | `/ao` | Buat |
| `GET` | `/ao/:id` | Detail beserta pelanggan yang dipegang |

---

## Payment Gateway

| Metode | Endpoint | Keterangan |
| --- | --- | --- |
| `GET` | `/payments` | Daftar transaksi |
| `GET` | `/payments/summary` | Total, pending, sudah dan belum tarik dana |
| `GET` | `/payments/by-region` | Distribusi per wilayah |
| `GET` | `/payments/withdrawals` | Sejarah penarikan |
| `POST` | `/payments/checkout` | Buat transaksi pembayaran |
| `POST` | `/webhooks/duitku` | Callback gateway, tanpa autentikasi bearer |

Webhook wajib memverifikasi tanda tangan dari gateway dan harus idempoten, karena
gateway mengirim ulang callback yang belum dikonfirmasi.

---

## Tiket

| Metode | Endpoint | Keterangan |
| --- | --- | --- |
| `GET` | `/tickets` | Daftar, filter status, teknisi, prioritas |
| `POST` | `/tickets` | Buat |
| `GET` | `/tickets/:id` | Detail |
| `PATCH` | `/tickets/:id` | Ubah status atau penugasan |
| `POST` | `/tickets/:id/comments` | Tambah komentar |
| `GET` | `/tickets/technicians` | Daftar teknisi untuk penugasan |
| `GET` | `/tickets/export` | Export |

---

## Keuangan

| Metode | Endpoint | Keterangan |
| --- | --- | --- |
| `GET` | `/finances` | Daftar transaksi |
| `POST` | `/finances` | Tambah transaksi |
| `PATCH` | `/finances/:id` | Ubah |
| `DELETE` | `/finances/:id` | Hapus |
| `GET` | `/finances/summary` | Pendapatan, pengeluaran, profit |
| `GET` | `/finances/chart` | Data grafik bulanan |
| `GET` | `/finances/categories` | Daftar kategori |
| `POST` | `/finances/categories` | Buat kategori |

---

## Reseller & Biller

| Metode | Endpoint | Keterangan |
| --- | --- | --- |
| `GET` | `/resellers` | Daftar, filter tipe reseller atau biller |
| `POST` | `/resellers` | Buat |
| `GET` | `/resellers/:id` | Detail |
| `GET` | `/resellers/:id/customers` | Pelanggan yang dipegang |
| `GET` | `/resellers/:id/logs` | Log aktivitas |
| `POST` | `/resellers/:id/pay` | Bayar komisi |

---

## Inventory

| Metode | Endpoint | Keterangan |
| --- | --- | --- |
| `GET` | `/inventory/items` | Daftar barang dan stok |
| `POST` | `/inventory/items` | Tambah barang |
| `GET` | `/inventory/categories` | Daftar kategori |
| `GET` | `/inventory/transactions` | Log mutasi stok |
| `POST` | `/inventory/transactions` | Stok masuk atau keluar |
| `GET` | `/inventory/summary` | Total aset |
| `GET` | `/inventory/export` | Export stok |

---

## Servers

| Metode | Endpoint | Keterangan |
| --- | --- | --- |
| `GET` | `/nas` | Daftar NAS |
| `POST` | `/nas` | Tambah, memeriksa kuota langganan |
| `GET` | `/nas/:id` | Detail |
| `POST` | `/nas/migrate` | Migrasi pelanggan antar NAS |
| `GET` | `/nas/port-forwarding` | Daftar aturan |
| `POST` | `/nas/port-forwarding` | Tambah aturan |
| `GET` | `/mikrotik` | Daftar perangkat |
| `POST` | `/mikrotik` | Tambah, memeriksa kuota |
| `PATCH` | `/mikrotik/:id` | Ubah |
| `POST` | `/mikrotik/:id/sync` | Sinkronisasi satu perangkat, `task_id` |
| `POST` | `/mikrotik/sync-all` | Sinkronisasi seluruh perangkat, `task_id` |

---

## Hotspot

| Metode | Endpoint | Keterangan |
| --- | --- | --- |
| `GET` | `/hotspot/vouchers` | Daftar voucher |
| `POST` | `/hotspot/vouchers` | Buat satu voucher |
| `POST` | `/hotspot/vouchers/generate` | Buat massal, `task_id` |
| `POST` | `/hotspot/vouchers/import` | Import |
| `GET` | `/hotspot/profiles` | Daftar profil |
| `POST` | `/hotspot/profiles` | Buat profil |
| `GET` | `/hotspot/usage` | Rekap pemakaian |
| `GET` | `/hotspot/quota` | Sisa kuota voucher |

---

## WhatsApp

| Metode | Endpoint | Keterangan |
| --- | --- | --- |
| `GET` | `/whatsapp/devices` | Daftar device terpasang |
| `POST` | `/whatsapp/devices` | Pasangkan device baru, mengembalikan QR |
| `POST` | `/whatsapp/devices/:id/reconnect` | Sambung ulang |
| `GET` | `/whatsapp/templates` | Daftar template |
| `POST` | `/whatsapp/templates` | Buat template |
| `GET` | `/whatsapp/broadcasts` | Daftar broadcast |
| `POST` | `/whatsapp/broadcasts` | Kirim broadcast, `task_id` |
| `GET` | `/whatsapp/inbox/:number` | Riwayat percakapan |
| `POST` | `/whatsapp/send` | Kirim satu pesan |
| `GET` | `/whatsapp/usage` | Pemakaian terhadap kuota |

---

## Pemetaan

| Metode | Endpoint | Keterangan |
| --- | --- | --- |
| `GET` | `/mapping/odp` | Daftar ODP beserta koordinat |
| `POST` | `/mapping/odp` | Tambah ODP |
| `GET` | `/mapping/customers` | Titik lokasi pelanggan |
| `GET` | `/mapping/stats` | Statistik jaringan |
| `GET` | `/mapping/export` | Export data peta |

---

## Laporan

| Metode | Endpoint | Keterangan |
| --- | --- | --- |
| `GET` | `/reports/summary` | Ringkasan keseluruhan |
| `GET` | `/reports/customers` | Laporan pelanggan |
| `GET` | `/reports/finances` | Laporan keuangan |
| `GET` | `/reports/billing` | Laporan tagihan |
| `GET` | `/reports/export` | Export |

---

## Dashboard

| Metode | Endpoint | Keterangan |
| --- | --- | --- |
| `GET` | `/dashboard/stats` | Kartu statistik pelanggan, tiket, tagihan |
| `GET` | `/dashboard/finance-analysis` | Analisis keuangan bulanan dan YTD |
| `GET` | `/dashboard/customer-analysis` | Analisis pertumbuhan pelanggan |
| `GET` | `/dashboard/map` | Lokasi pelanggan untuk peta |
| `GET` | `/dashboard/servers` | Daftar server untuk pemilihan default |

---

## Pengaturan & administrasi

| Metode | Endpoint | Keterangan |
| --- | --- | --- |
| `GET` | `/settings` | Ambil pengaturan tenant |
| `PATCH` | `/settings` | Simpan pengaturan |
| `POST` | `/settings/logo` | Unggah logo |
| `GET` | `/wilayah` | Daftar wilayah |
| `POST` | `/wilayah` | Tambah wilayah |
| `PATCH` | `/wilayah/:id` | Ubah atau nonaktifkan |
| `GET` | `/accounts` | Daftar akun pengguna |
| `POST` | `/accounts` | Tambah akun |
| `PATCH` | `/accounts/:id` | Ubah peran atau wilayah |
| `GET` | `/logs` | Jejak audit |
| `GET` | `/tasks` | Daftar job latar belakang |
| `GET` | `/tasks/:id` | Status dan progres satu job |
| `GET` | `/notifications` | Pusat notifikasi |

---

## Langganan tenant

| Metode | Endpoint | Keterangan |
| --- | --- | --- |
| `GET` | `/subscription` | Ikhtisar langganan |
| `GET` | `/subscription/status` | Status aktif dan tanggal berakhir |
| `GET` | `/subscription/plans` | Paket yang tersedia |
| `GET` | `/subscription/limits` | Kuota dan pemakaian |
| `GET` | `/subscription/bills` | Riwayat tagihan langganan |
| `POST` | `/subscription/subscribe` | Berlangganan atau naik paket |
