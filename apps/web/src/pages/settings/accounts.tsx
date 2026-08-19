import { ModuleScaffold } from '@/components/module-scaffold';

export default function AccountsPage() {
  return (
    <ModuleScaffold
      title="Manajemen Akun"
      stage="Tahap 1"
      columns={["Nama","Email","Telepon","Wilayah","Peran","Mode","Aksi"]}
      actions={["Tambah Akun","Refresh"]}
      filters={["Semua Peran","Semua Wilayah"]}
      endpoints={["GET /accounts","GET /permissions"]}
    />
  );
}
