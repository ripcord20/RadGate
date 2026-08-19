import { ModuleScaffold } from '@/components/module-scaffold';

export default function NasPage() {
  return (
    <ModuleScaffold
      title="Network Access Server"
      quota="nas"
      stage="Tahap 5"
      columns={["Nama","IP","Tipe","Wilayah","Status","Terakhir Terlihat","Aksi"]}
      actions={["Tambah","Migrasi","Refresh"]}
      filters={["Semua Status","Semua Wilayah"]}
      endpoints={["GET /nas"]}
    />
  );
}
