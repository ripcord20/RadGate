# Deployment

Panduan memasang RadGate di satu VPS untuk skala sekarang: sekitar 1.000 pelanggan,
satu tenant. Angka di bawah bukan tebakan, melainkan hasil dari jumlah layanan yang
harus hidup bersamaan, bukan dari jumlah baris di tabel pelanggan.

Status kode saat dokumen ini ditulis: fondasi sudah berjalan, modul bisnis belum.
Ikuti langkah di sini supaya mesin produksi siap, jangan menunggu seluruh roadmap
selesai baru memikirkan server.

---

## Spesifikasi mesin

| | Nilai |
| --- | --- |
| OS | Ubuntu 24.04 LTS (Noble Numbat), Server, amd64 |
| CPU | 4 vCPU |
| RAM | 8 GB |
| Disk | 100 GB NVMe SSD |
| Swap | 2 GB, hanya sebagai jaring pengaman |

Ubuntu 26.04 LTS sudah keluar sejak April 2026, tapi umurnya baru beberapa bulan dan
point release pertamanya baru dijadwalkan. Untuk sistem yang memegang uang pelanggan,
pakai 24.04 yang sudah dua tahun matang (sekarang 24.04.4). Didukung sampai Juni 2029,
bisa diperpanjang ke 2034 dengan Ubuntu Pro yang gratis untuk maksimal lima mesin.
Naik ke 26.04 bisa dilakukan sekitar 2028, jalurnya langsung dari 24.04.

Jangan pakai Ubuntu Desktop. Jangan pakai HDD. PostgreSQL dengan beban accounting
RADIUS sangat peka terhadap latensi tulis acak.

### Alokasi RAM

Database 621 pelanggan itu remeh, ukurannya di bawah 1 GB. Yang makan memori adalah
proses yang hidup bersamaan:

| Komponen | RAM | Catatan |
| --- | --- | --- |
| PostgreSQL | 2 GB | `shared_buffers` 2 GB |
| GenieACS + MongoDB | 2 GB | Untuk ~190 ONT. Belum dipasang di tahap ini |
| NestJS API | 1 GB | Termasuk worker BullMQ selama masih satu proses |
| WhatsApp gateway | 0,5 GB | Hanya kalau pakai Baileys, lihat peringatan di bawah |
| Redis | 0,5 GB | Cache + antrean |
| FreeRADIUS | 0,2 GB | Dipasang belakangan (tahap 3 roadmap) |
| Nginx | 0,1 GB | File statis |
| OS + cadangan | 1,5 GB | |
| **Total** | **~8 GB** | |

CPU 4 vCPU, bukan 2. Node single-threaded per proses: saat generate tagihan bulanan
atau sync Mikrotik jalan, satu core habis. Dengan 2 vCPU, pekerjaan latar itu bisa
membuat pelanggan gagal login PPPoE.

### Peringatan WhatsApp gateway

Angka 0,5 GB hanya berlaku kalau gateway memakai Baileys (WebSocket langsung). Kalau
memakai `whatsapp-web.js` yang menjalankan Chromium lewat Puppeteer, satu device makan
400–600 MB, tiga device langsung 1,8 GB. Ini penyebab klasik server billing kehabisan
memori padahal pelanggannya sedikit. Pilih Baileys, atau pindahkan gateway ke VM sendiri
sebelum jumlah device bertambah.

GenieACS dan WhatsApp gateway **belum dipasang di langkah di bawah**. Keduanya paling
sering crash dan paling rakus. Sesuai `docs/01-arsitektur.md`, pindahkan ke VM terpisah
begitu tahap 4 dan 7 dikerjakan, jangan tunggu sampai satu VM penuh.

### Kapan harus naik spesifikasi

| Skala | vCPU | RAM | Disk |
| --- | --- | --- | --- |
| Sekarang (~1.000 pelanggan, 1 tenant) | 4 | 8 GB | 100 GB NVMe |
| Tumbuh (~5.000 pelanggan atau beberapa tenant) | 8 | 16 GB | 200 GB NVMe |
| Besar (>5.000 atau banyak tenant) | pisah server | — | — |

Karena RadGate multi-tenant, sizing dihitung dari **total pelanggan seluruh tenant**,
bukan satu operator.

---

## Topologi di satu VPS

```
Internet
   │
   ├─ 443  app.contoh.id     Nginx → /var/www/radgate/web   (SPA)
   └─ 443  api.contoh.id     Nginx → 127.0.0.1:3000/v1      (NestJS)

127.0.0.1:5432   PostgreSQL 16
127.0.0.1:6379   Redis
127.0.0.1:3000   NestJS  (hanya loopback, tidak dibuka ke publik)
```

Port 3000, 5432, dan 6379 tidak boleh terbuka ke internet. Nginx satu-satunya yang
menerima 80/443.

Ganti `contoh.id` dengan domain Anda di seluruh dokumen ini. Dua subdomain wajib dari
hari pertama karena refresh token dikirim sebagai cookie `HttpOnly` dengan
`SameSite=Strict`, dan CORS di backend menolak wildcard. Satu domain dengan path
`/api` juga sah, tapi dua subdomain mengikuti pemisahan layanan di arsitektur dan
memudahkan memindahkan API ke mesin lain nanti tanpa mengubah URL yang sudah
tertanam di bundel frontend.

---

## 1. Persiapan OS

Login sebagai pengguna yang punya `sudo`, bukan sebagai root permanen.

```bash
sudo apt update && sudo apt upgrade -y
sudo timedatectl set-timezone Asia/Jakarta
sudo apt install -y ufw fail2ban unattended-upgrades curl git build-essential
```

Buat pengguna khusus untuk menjalankan aplikasi. Proses Node tidak boleh jalan
sebagai root.

```bash
sudo adduser --system --group --home /opt/radgate radgate
sudo mkdir -p /opt/radgate /var/www/radgate/web /etc/radgate /var/log/radgate
sudo chown radgate:radgate /opt/radgate /var/log/radgate
```

Firewall sebelum layanan apa pun dipasang. SSH jangan sampai terkunci.

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

Aktifkan pembaruan keamanan otomatis:

```bash
sudo dpkg-reconfigure -plow unattended-upgrades
```

Swap 2 GB sebagai jaring pengaman, bukan sebagai RAM tambahan:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
echo 'vm.swappiness=10' | sudo tee /etc/sysctl.d/99-radgate.conf
sudo sysctl --system
```

---

## 2. Node.js 22

Repositori Ubuntu 24.04 membawa Node 18. NestJS 11 dan Prisma 6 membutuhkan 20 ke
atas. Pakai NodeSource untuk Node 22 LTS.

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v    # harus v22.x
npm -v
```

Jangan pakai `nvm` di server produksi. systemd tidak memuat lingkungan login
pengguna, jadi path `nvm` akan hilang saat service di-restart.

---

## 3. PostgreSQL 16

Ubuntu 24.04 membawa PostgreSQL 16 di repositori resmi.

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql
```

Buat peran dan basis data. Password di bawah hanya contoh, ganti dengan nilai acak
minimal 24 karakter.

```bash
sudo -u postgres psql <<'SQL'
CREATE USER radgate WITH PASSWORD 'ganti-password-ini';
CREATE DATABASE radgate OWNER radgate;
GRANT ALL PRIVILEGES ON DATABASE radgate TO radgate;
\c radgate
GRANT ALL ON SCHEMA public TO radgate;
ALTER DATABASE radgate SET timezone TO 'Asia/Jakarta';
SQL
```

Hanya izinkan koneksi dari mesin sendiri. Di `/etc/postgresql/16/main/pg_hba.conf`,
baris IPv4 harus seperti ini, bukan `0.0.0.0/0`:

```
local   all             postgres                                peer
local   all             all                                     peer
host    radgate         radgate         127.0.0.1/32            scram-sha-256
host    all             all             127.0.0.1/32            scram-sha-256
```

Restart setelah mengubah berkas itu: `sudo systemctl restart postgresql`.

### Penyetelan untuk 8 GB RAM + NVMe

Sunting `/etc/postgresql/16/main/postgresql.conf`:

```
shared_buffers = 2GB
effective_cache_size = 6GB
maintenance_work_mem = 256MB
work_mem = 16MB
wal_buffers = 16MB
checkpoint_completion_target = 0.9
max_wal_size = 2GB
min_wal_size = 256MB
max_connections = 80
random_page_cost = 1.1
effective_io_concurrency = 200
log_min_duration_statement = 500
log_checkpoints = on
```

`shared_buffers` 2 GB adalah 25% RAM, angka yang disarankan PostgreSQL. `work_mem`
16 MB kali `max_connections` 80 = 1,28 GB di puncak, masih muat. Jangan naikkan
`max_connections` "supaya aman": setiap koneksi idle tetap makan memori, dan
kumpulan koneksi Prisma sudah cukup dengan puluhan, bukan ratusan.

```bash
sudo systemctl restart postgresql
sudo -u postgres psql -c "SHOW shared_buffers;"
```

---

## 4. Redis

```bash
sudo apt install -y redis-server
```

Sunting `/etc/redis/redis.conf`:

```
bind 127.0.0.1 ::1
protected-mode yes
requirepass ganti-password-redis
maxmemory 512mb
maxmemory-policy allkeys-lru
appendonly yes
```

`allkeys-lru` membuang kunci cache yang jarang dipakai saat memori penuh. Antrean
BullMQ memakai prefiks sendiri; kalau nanti job hilang karena ter-evict, pindahkan
antrean ke instance Redis terpisah. Untuk tahap fondasi, satu instance cukup.

```bash
sudo systemctl enable --now redis-server
sudo systemctl restart redis-server
redis-cli -a 'ganti-password-redis' ping    # PONG
```

URL koneksi menjadi `redis://:ganti-password-redis@127.0.0.1:6379`.

---

## 5. Kode aplikasi

Klon ke home pengguna `radgate`. Repo GitHub-nya privat, jadi butuh deploy key
atau token dengan cakupan `repo`.

```bash
sudo -u radgate -H git clone git@github.com:ripcord20/RadGate.git /opt/radgate
cd /opt/radgate
```

Kalau SSH deploy key belum ada:

```bash
sudo -u radgate -H ssh-keygen -t ed25519 -f /opt/radgate/.ssh/id_ed25519 -N ''
sudo -u radgate -H cat /opt/radgate/.ssh/id_ed25519.pub
```

Tempel kunci publik itu di GitHub → repo RadGate → Settings → Deploy keys, dengan
akses baca saja.

Pasang dependensi dan bangun. Urutan penting: `@radgate/shared` harus dibangun
sebelum API, karena backend memuat hasil `dist/` paket itu, bukan sumber TypeScript.

```bash
cd /opt/radgate
sudo -u radgate npm ci
sudo -u radgate npm run build --workspace @radgate/shared
sudo -u radgate npm run build --workspace @radgate/api
```

Frontend membutuhkan URL API **pada saat build**, karena Vite menanamkannya ke
dalam bundel. Set dulu, baru bangun:

```bash
sudo -u radgate tee /opt/radgate/apps/web/.env.production >/dev/null <<'EOF'
VITE_API_URL=https://api.contoh.id/v1
EOF
sudo -u radgate npm run build --workspace @radgate/web
sudo rm -rf /var/www/radgate/web/*
sudo cp -a /opt/radgate/apps/web/dist/. /var/www/radgate/web/
```

Mengubah subdomain API nanti berarti **membangun ulang frontend**, bukan hanya
mengganti Nginx.

---

## 6. Variabel lingkungan API

Jangan taruh rahasia di home pengguna atau di repo. Satu berkas, dimiliki root,
dibaca systemd.

```bash
sudo nano /etc/radgate/api.env
```

Isi:

```
NODE_ENV=production
PORT=3000

DATABASE_URL=postgresql://radgate:ganti-password-ini@127.0.0.1:5432/radgate?schema=public
REDIS_URL=redis://:ganti-password-redis@127.0.0.1:6379

JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
DEVICE_ENCRYPTION_KEY=

CORS_ORIGINS=https://app.contoh.id
RECAPTCHA_SECRET=
```

Generate tiga rahasia, jangan ketik sendiri:

```bash
# JWT, dua nilai berbeda. Kalau sama, refresh token yang tercuri bisa dipakai
# sebagai access token. Lihat apps/api/.env.example.
openssl rand -base64 48
openssl rand -base64 48

# Kunci enkripsi kredensial perangkat: 32 byte, lalu di-encode base64.
openssl rand -base64 32
```

Kunci enkripsi perangkat dipakai AES-GCM untuk password Mikrotik, NAS, dan PPPoE.
Kalau hilang, kredensial perangkat tidak bisa dibaca kembali. Simpan salinannya di
tempat terpisah dari server, misalnya password manager, bukan di Discord.

```bash
sudo chown root:radgate /etc/radgate/api.env
sudo chmod 640 /etc/radgate/api.env
```

Jalankan migrasi sekali, memakai URL yang sama:

```bash
cd /opt/radgate/apps/api
sudo -u radgate --preserve-env=DATABASE_URL \
  DATABASE_URL='postgresql://radgate:ganti-password-ini@127.0.0.1:5432/radgate?schema=public' \
  npx prisma migrate deploy
```

`migrate deploy` untuk produksi, bukan `migrate dev`. Yang kedua membuat migrasi
baru dari selisih skema, yang pertama hanya menerapkan yang sudah ada di repo.

---

## 7. systemd

Satu unit untuk API. Worker BullMQ masih hidup di dalam proses yang sama pada
tahap fondasi; pisahkan jadi unit sendiri begitu antrean mulai berat
(broadcast WhatsApp, generate tagihan ribuan baris).

`/etc/systemd/system/radgate-api.service`:

```ini
[Unit]
Description=RadGate API
After=network.target postgresql.service redis-server.service
Wants=postgresql.service redis-server.service

[Service]
Type=simple
User=radgate
Group=radgate
WorkingDirectory=/opt/radgate/apps/api
EnvironmentFile=/etc/radgate/api.env
ExecStart=/usr/bin/node dist/main.js
Restart=on-failure
RestartSec=5
TimeoutStopSec=30

# NestJS memanggil enableShutdownHooks(); SIGTERM memberi waktu menutup
# koneksi Prisma dan job yang sedang jalan.
KillSignal=SIGTERM

NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/log/radgate /opt/radgate

LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now radgate-api
sudo systemctl status radgate-api
journalctl -u radgate-api -f
```

Log yang sehat memuat baris `RadGate API berjalan di http://localhost:3000/v1`.
Kalau gagal, penyebab tersering adalah `DATABASE_URL` salah, `@radgate/shared`
belum di-build, atau `CORS_ORIGINS` berisi spasi.

---

## 8. Nginx + TLS

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

Sertifikat dulu, supaya berkas HTTPS bisa merujuk path Let's Encrypt yang sudah
ada. DNS `app.contoh.id` dan `api.contoh.id` harus sudah mengarah ke IP VPS.

```bash
sudo certbot --nginx -d app.contoh.id -d api.contoh.id
```

Kalau certbot menulis konfigurasi otomatis yang berantakan, hapus server block
yang dibuatnya lalu pakai dua berkas di bawah. Perbarui sertifikat tetap jalan
lewat timer systemd `certbot.timer`.

### Portal admin — `/etc/nginx/sites-available/radgate-app`

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name app.contoh.id;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name app.contoh.id;

    ssl_certificate     /etc/letsencrypt/live/app.contoh.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.contoh.id/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    root /var/www/radgate/web;
    index index.html;

    # SPA: semua path yang bukan berkas nyata jatuh ke index.html.
    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|woff2|png|svg|ico)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header Referrer-Policy strict-origin-when-cross-origin;
}
```

### API — `/etc/nginx/sites-available/radgate-api`

```nginx
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

server {
    listen 80;
    listen [::]:80;
    server_name api.contoh.id;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.contoh.id;

    ssl_certificate     /etc/letsencrypt/live/app.contoh.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.contoh.id/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    client_max_body_size 20m;

    location /v1/auth/login {
        limit_req zone=login burst=3 nodelay;
        proxy_pass http://127.0.0.1:3000;
        include /etc/nginx/snippets/radgate-proxy.conf;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        include /etc/nginx/snippets/radgate-proxy.conf;
    }
}
```

Sertifikat di blok API merujuk folder `app.contoh.id` karena `certbot -d app -d api`
menyimpan kedua nama di bawah sertifikat pertama. Sesuaikan kalau Anda meminta
sertifikat terpisah.

`/etc/nginx/snippets/radgate-proxy.conf`:

```nginx
proxy_http_version 1.1;
proxy_set_header Host              $host;
proxy_set_header X-Real-IP         $remote_addr;
proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header Upgrade           $http_upgrade;
proxy_set_header Connection        "upgrade";
proxy_read_timeout 60s;
```

Cookie refresh token butuh HTTPS di produksi (`Secure`). Header `X-Forwarded-Proto`
wajib diteruskan, kalau tidak NestJS akan mengira request datang lewat HTTP dan
cookie tidak terkirim.

```bash
sudo ln -s /etc/nginx/sites-available/radgate-app /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/radgate-api /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Uji:

```bash
curl -sI https://app.contoh.id
curl -sI https://api.contoh.id/v1
```

Yang kedua mungkin 404 selama belum ada rute `GET /v1/`, itu normal. Yang tidak
normal adalah connection refused atau sertifikat yang tidak dipercaya.

---

## 9. Cadangan

Yang wajib disalin ke luar mesin, setiap hari:

1. Dump PostgreSQL
2. Berkas `/etc/radgate/api.env` dan kunci `DEVICE_ENCRYPTION_KEY`
3. Isi `/var/www` tidak perlu, itu hasil build yang bisa diulang

```bash
sudo mkdir -p /var/backups/radgate
sudo tee /usr/local/sbin/radgate-backup >/dev/null <<'EOF'
#!/bin/bash
set -euo pipefail
STAMP=$(date +%F)
OUT=/var/backups/radgate/radgate-$STAMP.dump
sudo -u postgres pg_dump -Fc radgate > "$OUT"
find /var/backups/radgate -name '*.dump' -mtime +14 -delete
EOF
sudo chmod 700 /usr/local/sbin/radgate-backup
```

Jalankan setiap hari pukul 02:15:

```
15 2 * * * root /usr/local/sbin/radgate-backup
```

Salin dump ke mesin lain atau object storage. Cadangan yang hanya ada di disk
yang sama dengan database bukan cadangan.

Retensi data operasional, supaya disk 100 GB tidak habis diam-diam:

- Sesi RADIUS: hapus yang lebih tua dari 6 bulan
- Telemetri ONT mentah: ringkas harian, buang detail di atas 90 hari
- Log aktivitas: 12 bulan

Kebijakan itu belum ada di kode; catat sebagai pekerjaan saat tahap 3 dan 7.

---

## 10. Memperbarui aplikasi

```bash
cd /opt/radgate
sudo -u radgate git pull --ff-only
sudo -u radgate npm ci
sudo -u radgate npm run build --workspace @radgate/shared
sudo -u radgate npm run build --workspace @radgate/api
cd apps/api
sudo -u radgate --preserve-env=DATABASE_URL \
  DATABASE_URL='postgresql://radgate:...@127.0.0.1:5432/radgate?schema=public' \
  npx prisma migrate deploy
sudo systemctl restart radgate-api

# Frontend hanya kalau ada perubahan UI atau VITE_API_URL
sudo -u radgate npm run build --workspace @radgate/web
sudo rsync -a --delete /opt/radgate/apps/web/dist/ /var/www/radgate/web/
```

`--ff-only` menolak pull yang harus di-merge di server. Kalau itu terjadi,
berarti ada commit liar di mesin produksi; perbaiki di laptop, bukan di VPS.

---

## Yang sengaja belum dipasang di mesin ini

| Layanan | Kapan | Kenapa ditunda |
| --- | --- | --- |
| FreeRADIUS | Tahap 3 | Belum ada modul jaringan |
| GenieACS + MongoDB | Tahap 7 | 2 GB RAM, sering crash, pindahkan ke VM sendiri |
| WhatsApp gateway | Tahap 4 | Sama, jangan satu nasib dengan billing |
| Tile server peta | Tahap 7 | Beban I/O berbeda, subdomain `maps.` |
| Portal pelanggan `client.` | Tahap 2 | Permukaan serangan publik, isolasi terpisah |

Begitu salah satu dari itu masuk, ulangi perhitungan RAM. Jangan "sementara
ditumpuk dulu".

---

## Daftar periksa sebelum DNS diarahkan ke publik

- [ ] `ufw status` hanya 22, 80, 443
- [ ] `ss -tlnp` tidak menampilkan 3000, 5432, 6379 di `0.0.0.0`
- [ ] `/etc/radgate/api.env` mode `640`, bukan milik git
- [ ] `JWT_ACCESS_SECRET` dan `JWT_REFRESH_SECRET` berbeda
- [ ] `DEVICE_ENCRYPTION_KEY` tersimpan di luar server
- [ ] `curl https://app.contoh.id` mengembalikan `index.html`
- [ ] Login dari browser mengirim cookie `Secure` + `HttpOnly`
- [ ] `pg_dump` uji sudah dijalankan dan berkasnya bisa di-restore di laptop
- [ ] Swap ada, `swappiness=10`
- [ ] `unattended-upgrades` aktif
