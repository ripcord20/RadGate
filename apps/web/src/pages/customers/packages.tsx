import { ModuleScaffold } from '@/components/module-scaffold';

export default function InternetPackagesPage() {
  return (
    <ModuleScaffold
      title="Paket Internet"
      stage="Tahap 1"
      columns={["Nama Paket","Kecepatan","Harga","Profil Mikrotik","Status","Aksi"]}
      actions={["Tambah","Refresh"]}
      filters={["Semua Status","Semua Wilayah"]}
      endpoints={["GET /internet-packages"]}
    />
  );
}
