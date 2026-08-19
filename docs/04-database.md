# Skema database

PostgreSQL. Seluruh tabel operasional membawa `tenant_id`, dan sebagian besar juga
membawa `wilayah_id`.

## Aturan yang berlaku di semua tabel

**Kolom wajib** `id` (UUID), `tenant_id`, `created_at`, `updated_at`. Tabel yang datanya
tidak boleh hilang menambahkan `deleted_at` untuk soft delete.

**Isolasi tenant** Aktifkan Row Level Security di PostgreSQL dengan kebijakan berbasis
`tenant_id`. Ini lapisan pengaman kedua di bawah scope aplikasi: kalau ada satu query
yang lupa memfilter, database yang menolak. Untuk sistem multi-tenant yang menyimpan data
keuangan, satu lapis saja tidak cukup.

**Uang** Simpan sebagai `BIGINT` dalam satuan rupiah penuh, jangan `FLOAT`. Pembulatan
floating point pada nilai uang menghasilkan selisih yang mustahil direkonsiliasi.

**Kredensial perangkat** Password Mikrotik, NAS, dan PPPoE dienkripsi dengan AES-GCM
memakai kunci dari KMS atau variabel lingkungan, bukan di-hash, karena nilainya perlu
dibaca kembali untuk menghubungi perangkat. Jangan pernah mengirimkannya ke frontend.

**Indeks** Setiap foreign key diberi indeks. Tambahan indeks komposit pada
`(tenant_id, wilayah_id, status)` untuk tabel pelanggan dan tagihan, karena kombinasi
itulah yang dipakai hampir semua query daftar.

---

## Tenant & akses

### `tenants`
Operator ISP. `name`, `company_name`, `logo_url`, `timezone`, `status`.

### `users`
`tenant_id`, `wilayah_id` (nullable, `NULL` berarti seluruh wilayah), `name`, `email`
(unik per tenant), `password_hash` (Argon2id), `phone`, `role`, `mode`, `last_login_at`,
`status`.

`role` berupa enum: `owner`, `admin`, `teknisi`, `reseller`, `biller`.

### `permissions`
Peta izin per peran per tenant. `role`, `module`, `can_view`, `can_create`, `can_update`,
`can_delete`. Memungkinkan tiap operator menyesuaikan kewenangan tanpa mengubah kode.

### `wilayah`
`tenant_id`, `name`, `code` (singkatan seperti `MDR`, `LTG`), `logo_url`, `is_active`.

`code` dipakai sebagai awalan ID pelanggan, jadi harus unik per tenant dan tidak boleh
diubah setelah dipakai.

### `settings`
Satu baris per tenant. Menyimpan informasi perusahaan, pengaturan pajak, kebijakan
sistem, dan kredensial payment gateway dalam kolom JSONB terenkripsi.

---

## Pelanggan

### `customers`
```
tenant_id, wilayah_id, customer_code, name, email, phone, nik, address,
latitude, longitude, pppoe_username, pppoe_password_enc, ip_mode, ip_address,
package_id, reseller_id, odp_id, nas_id, billing_type, installation_date,
due_day, installation_fee, discount, app_password_hash, notes, status
```

`billing_type` bernilai `prepaid` atau `postpaid`. `status` bernilai `aktif`, `expired`,
`berhenti`, atau `isolir`. `due_day` menyimpan tanggal jatuh tempo dalam bulan (1–31),
bukan tanggal penuh, karena tagihan berulang tiap bulan.

Indeks unik pada `(tenant_id, pppoe_username)`.

### `internet_packages`
`tenant_id`, `name`, `speed_up`, `speed_down`, `price`, `mikrotik_profile`, `is_active`.

### `customer_devices`
Telemetri ONT dari TR-069/ACS.
```
customer_id, serial_number, manufacturer, model, pon_mode, ip_address,
rx_power, tx_power, temperature, uptime_seconds, firmware, raw_data (JSONB),
last_seen_at, status
```

`raw_data` menampung parameter ACS yang berbeda-beda antar merek, sehingga penambahan
merek baru tidak memerlukan migrasi kolom.

### `customer_sessions`
Riwayat sesi RADIUS untuk kolom Aktivitas dan deteksi anomali.
`customer_id`, `nas_id`, `ip_address`, `started_at`, `ended_at`, `bytes_in`, `bytes_out`,
`terminate_cause`.

### `login_anomalies`
`customer_id`, `type`, `detail` (JSONB), `detected_at`, `is_resolved`.

### `speed_on_demand`
`customer_id`, `speed_up`, `speed_down`, `price`, `starts_at`, `ends_at`, `status`.

---

## Tagihan & pembayaran

### `invoices`
```
tenant_id, wilayah_id, invoice_number, customer_id, package_id, reseller_id,
period_month, period_year, amount, discount, tax, total, status,
due_date, paid_at, paid_by, payment_method, notes
```

`status` bernilai `unpaid`, `paid`, `overdue`, `debt`, atau `cancelled`.
`paid_by` merujuk `users.id`, yaitu jejak siapa yang menyetujui pembayaran tunai.

Indeks unik pada `(tenant_id, customer_id, period_month, period_year)`. Batasan inilah
yang membuat generate tagihan idempoten di tingkat database, sehingga menjalankannya dua
kali tidak menghasilkan tagihan ganda.

### `invoice_payments`
Satu invoice bisa dilunasi bertahap.
`invoice_id`, `amount`, `method`, `paid_at`, `received_by`, `reference`, `notes`.

### `payment_transactions`
Transaksi payment gateway.
```
tenant_id, wilayah_id, invoice_id, gateway, reference, method, amount, fee,
net_amount, status, is_withdrawn, withdrawal_id, paid_at, raw_callback (JSONB)
```

`is_withdrawn` yang memisahkan uang yang sudah masuk rekening operator dari yang masih
mengendap di gateway.

### `withdrawals`
`tenant_id`, `amount`, `bank_account`, `status`, `requested_at`, `completed_at`.

### `account_officers`
`tenant_id`, `wilayah_id`, `user_id`, `name`, `phone`, `status`.

### `account_officer_customers`
Tabel penghubung. `account_officer_id`, `customer_id`, `assigned_at`.

---

## Keuangan

### `finance_categories`
`tenant_id`, `name`, `type` (`income` atau `expense`), `is_active`.

### `finance_transactions`
`tenant_id`, `wilayah_id`, `category_id`, `type`, `amount`, `description`,
`transaction_date`, `reference_type`, `reference_id`, `created_by`.

`reference_type` dan `reference_id` menautkan transaksi ke sumbernya, misalnya
pembayaran invoice, sehingga pemasukan dari tagihan tercatat otomatis dan bisa ditelusuri
balik.

### `report_daily_snapshots`
Agregat harian yang dihitung job terjadwal.
`tenant_id`, `wilayah_id`, `date`, `metrics` (JSONB).

Modul Laporan membaca dari sini, bukan memindai tabel transaksi mentah.

---

## Reseller

### `resellers`
`tenant_id`, `wilayah_id`, `user_id`, `name`, `phone`, `type` (`reseller` atau `biller`),
`commission_type`, `commission_value`, `balance`, `status`.

### `reseller_transactions`
`reseller_id`, `invoice_id`, `type`, `amount`, `balance_after`, `notes`.

Menyimpan `balance_after` di setiap baris membuat saldo bisa diaudit tanpa menjumlah
ulang seluruh riwayat.

---

## Inventory

### `inventory_categories`
`tenant_id`, `name`.

### `inventory_items`
`tenant_id`, `wilayah_id`, `code`, `name`, `category_id`, `unit`, `stock`, `unit_price`,
`description`.

### `inventory_transactions`
`item_id`, `wilayah_id`, `type` (`in` atau `out`), `quantity`, `stock_after`,
`reference_type`, `reference_id`, `notes`, `created_by`.

Pemasangan pelanggan menghasilkan baris `out` dengan `reference_type = 'customer'`.
Perubahan stok harus dilakukan dalam transaksi database yang sama dengan pembuatan
pelanggan, supaya stok tidak pernah berbeda dari catatan.

---

## Jaringan

### `nas`
`tenant_id`, `wilayah_id`, `name`, `ip_address`, `secret_enc`, `type`, `ports`,
`is_default`, `status`, `last_seen_at`.

### `port_forwarding`
`nas_id`, `name`, `protocol`, `external_port`, `internal_ip`, `internal_port`,
`is_active`.

### `mikrotik_devices`
`tenant_id`, `wilayah_id`, `name`, `host`, `port`, `username`, `password_enc`,
`api_type`, `version`, `status`, `last_sync_at`, `sync_error`.

### `odp`
`tenant_id`, `wilayah_id`, `name`, `code`, `latitude`, `longitude`, `capacity`,
`used_ports`, `parent_odc_id`, `notes`.

Kolom `capacity` dan `used_ports` yang menghasilkan tampilan "ODP PANDEREJO 8 Port" di
kolom ODP daftar pelanggan.

---

## Hotspot

### `hotspot_profiles`
`tenant_id`, `name`, `mikrotik_profile`, `speed_up`, `speed_down`, `duration_minutes`,
`data_quota_mb`, `price`.

### `hotspot_vouchers`
`tenant_id`, `wilayah_id`, `profile_id`, `reseller_id`, `code`, `password`, `batch_id`,
`status`, `used_at`, `expires_at`, `sold_at`, `sold_price`.

`batch_id` mengelompokkan voucher hasil satu kali generate massal agar bisa dicetak dan
ditarik kembali sebagai satu kelompok.

### `hotspot_sessions`
`voucher_id`, `nas_id`, `mac_address`, `ip_address`, `started_at`, `ended_at`,
`bytes_in`, `bytes_out`.

---

## Tiket

### `tickets`
`tenant_id`, `wilayah_id`, `ticket_number`, `customer_id`, `title`, `description`,
`category`, `priority`, `status`, `assigned_to`, `resolved_at`, `created_by`.

`status` bernilai `baru`, `proses`, atau `selesai`. `priority` bernilai `rendah`,
`sedang`, `tinggi`, atau `urgent`.

### `ticket_comments`
`ticket_id`, `user_id`, `comment`, `attachments` (JSONB).

---

## WhatsApp & notifikasi

### `whatsapp_devices`
`tenant_id`, `name`, `phone_number`, `provider` (`internal` atau `external`),
`session_data_enc`, `status`, `last_connected_at`.

### `whatsapp_templates`
`tenant_id`, `name`, `content`, `variables` (JSONB), `category`.

### `whatsapp_broadcasts`
`tenant_id`, `template_id`, `device_id`, `target_filter` (JSONB), `total_targets`,
`sent_count`, `failed_count`, `status`, `task_id`, `scheduled_at`.

### `whatsapp_messages`
`tenant_id`, `device_id`, `customer_id`, `phone_number`, `direction`, `content`,
`status`, `error`, `sent_at`.

### `notifications`
`tenant_id`, `user_id`, `type`, `title`, `body`, `data` (JSONB), `read_at`.

### `notification_devices`
`user_id`, `device_token`, `platform`, `last_active_at`.

---

## Sistem

### `tasks`
Job latar belakang.
`tenant_id`, `type`, `payload` (JSONB), `status`, `progress`, `total`, `result` (JSONB),
`error`, `started_at`, `finished_at`, `created_by`.

`status` bernilai `pending`, `running`, `success`, atau `failed`.

### `activity_logs`
Jejak audit.
`tenant_id`, `user_id`, `action`, `module`, `reference_id`, `changes` (JSONB),
`ip_address`, `user_agent`.

Simpan `changes` sebagai selisih nilai lama dan baru, bukan seluruh isi record, agar
tabel ini tidak membengkak.

---

## Langganan tenant

### `subscription_plans`
`name`, `price_monthly`, `price_yearly`, `limits` (JSONB), `features` (JSONB),
`is_active`.

`limits` menyimpan kuota dalam bentuk seperti
`{"customers": 1000, "nas": 24, "mikrotik": 24, "hotspot_vouchers": 50000, "whatsapp_messages": 10000}`.

Menyimpannya sebagai JSONB membuat penambahan jenis kuota baru tidak memerlukan migrasi.

### `subscriptions`
`tenant_id`, `plan_id`, `status`, `started_at`, `expires_at`, `auto_renew`,
`billing_cycle`.

### `subscription_usage`
`tenant_id`, `metric`, `used`, `period_start`, `period_end`.

Diperbarui lewat trigger atau job berkala, lalu dibaca endpoint `/subscription/limits`
untuk memutuskan apakah operasi pembuatan boleh dilanjutkan.

### `subscription_invoices`
`tenant_id`, `subscription_id`, `invoice_number`, `amount`, `status`, `due_date`,
`paid_at`, `payment_reference`.
