import { ModuleScaffold } from '@/components/module-scaffold';

export default function MikrotikFormPage() {
  return (
    <ModuleScaffold
      title="Perangkat Mikrotik"
      stage="Tahap 5"
      description="Kredensial disimpan terenkripsi dan tidak pernah dikirim balik ke frontend."
      actions={["Uji Koneksi","Simpan"]}
      endpoints={["POST /mikrotik","PATCH /mikrotik/:id"]}
    />
  );
}
