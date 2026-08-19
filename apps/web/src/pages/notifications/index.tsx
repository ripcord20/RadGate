import { ModuleScaffold } from '@/components/module-scaffold';

export default function NotificationsPage() {
  return (
    <ModuleScaffold
      title="Pusat Notifikasi"
      stage="Tahap 7"
      columns={["Waktu","Jenis","Judul","Isi","Status"]}
      endpoints={["GET /notifications","GET /notifications/devices"]}
    />
  );
}
