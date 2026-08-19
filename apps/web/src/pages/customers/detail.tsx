import { ModuleScaffold } from '@/components/module-scaffold';

export default function CustomerDetailPage() {
  return (
    <ModuleScaffold
      title="Detail Pelanggan"
      stage="Tahap 2"
      description="Profil, layanan, riwayat tagihan, riwayat sesi, perangkat, dan tiket terkait."
      endpoints={["GET /customers/:id"]}
    />
  );
}
