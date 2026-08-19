import { ModuleScaffold } from '@/components/module-scaffold';

export default function CustomersPage() {
  return (
    <ModuleScaffold
      title="Pelanggan"
      quota="customers"
      stage="Tahap 2"
      columns={["Pelanggan","Status","Paket & IP","Aktivitas","ODP","Alamat","Telepon","Terakhir Bayar","Jatuh Tempo","Instalasi","Wilayah","Aksi"]}
      actions={["Tambah","Import","Refresh"]}
      filters={["Semua Status","Semua Paket","Semua Wilayah","Semua Diskon","Semua Reseller","Kelengkapan"]}
      endpoints={["GET /customers","GET /customers/summary"]}
    />
  );
}
