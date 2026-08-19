import { ModuleScaffold } from '@/components/module-scaffold';

export default function ActivityLogPage() {
  return (
    <ModuleScaffold
      title="Log Aktivitas"
      stage="Tahap 1"
      description="Jejak audit menyimpan selisih nilai lama dan baru, bukan seluruh record."
      columns={["Waktu","Pengguna","Aksi","Modul","Perubahan","IP"]}
      filters={["Rentang Tanggal","Semua Modul","Semua Pengguna"]}
      endpoints={["GET /logs"]}
    />
  );
}
