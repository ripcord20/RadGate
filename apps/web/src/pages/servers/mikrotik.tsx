import { ModuleScaffold } from '@/components/module-scaffold';

export default function MikrotikPage() {
  return (
    <ModuleScaffold
      title="Perangkat Mikrotik"
      quota="mikrotik"
      stage="Tahap 5"
      columns={["Nama","Host","Versi","Wilayah","Status","Sinkron Terakhir","Aksi"]}
      actions={["Tambah","Sync Semua","Refresh"]}
      filters={["Semua Status","Semua Wilayah"]}
      endpoints={["GET /mikrotik","POST /mikrotik/:id/sync"]}
    />
  );
}
