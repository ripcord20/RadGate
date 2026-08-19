import { ModuleScaffold } from '@/components/module-scaffold';

export default function AnomaliLoginPage() {
  return (
    <ModuleScaffold
      title="Anomali Login"
      stage="Tahap 5"
      description="Deteksi pemakaian satu akun PPPoE dari beberapa lokasi atau perangkat."
      columns={["Pelanggan","Jenis Anomali","Detail","Terdeteksi","Status"]}
      endpoints={["GET /customers/anomalies"]}
    />
  );
}
