import { ModuleScaffold } from '@/components/module-scaffold';

export default function AccountOfficerPage() {
  return (
    <ModuleScaffold
      title="Manajemen Account Officer"
      stage="Tahap 10"
      columns={["Nama","Telepon","Wilayah","Jumlah Pelanggan","Nilai Tagihan","Status","Aksi"]}
      actions={["Tambah","Refresh"]}
      filters={["Semua Status","Semua Wilayah"]}
      endpoints={["GET /account-officers"]}
    />
  );
}
