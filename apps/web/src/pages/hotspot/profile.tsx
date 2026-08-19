import { ModuleScaffold } from '@/components/module-scaffold';

export default function HotspotProfilePage() {
  return (
    <ModuleScaffold
      title="Profil Hotspot"
      stage="Tahap 9"
      columns={["Nama","Profil Mikrotik","Kecepatan","Durasi","Kuota Data","Harga","Aksi"]}
      actions={["Tambah"]}
      endpoints={["GET /hotspot/profiles"]}
    />
  );
}
