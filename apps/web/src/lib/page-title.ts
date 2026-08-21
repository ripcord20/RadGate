/**
 * Judul di bilah atas mengikuti rute aktif, seperti layar operasional yang dipakai petugas
 * di ponsel: nama modul harus terbaca tanpa melihat sidebar.
 */
export function pageTitleFromPath(pathname: string): string {
  const rules: [string, string][] = [
    ['/billing/generate', 'Generate Tagihan'],
    ['/billing/detail', 'Detail Tagihan'],
    ['/billing', 'Tagihan'],
    ['/ao', 'Account Officer'],
    ['/customers/add', 'Tambah Pelanggan'],
    ['/customers/edit', 'Ubah Pelanggan'],
    ['/customers/detail', 'Detail Pelanggan'],
    ['/customers/packages', 'Paket Internet'],
    ['/customers', 'Pelanggan'],
    ['/hotspot', 'Hotspot'],
    ['/payment-gateway', 'Payment Gateway'],
    ['/tiket', 'Tiket'],
    ['/reseller', 'Reseller'],
    ['/finances', 'Keuangan'],
    ['/pemetaan', 'Pemetaan'],
    ['/inventory', 'Inventory'],
    ['/nas', 'NAS'],
    ['/mikrotik', 'Mikrotik'],
    ['/notifications-center', 'Notifikasi'],
    ['/whatsapp', 'WhatsApp'],
    ['/reports', 'Laporan'],
    ['/wilayah', 'Wilayah'],
    ['/accounts', 'Akun'],
    ['/settings', 'Pengaturan'],
    ['/subscription', 'Langganan'],
    ['/profile', 'Profil'],
    ['/dashboard', 'Dashboard'],
  ];

  for (const [prefix, title] of rules) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return title;
  }
  return 'RadGate';
}
