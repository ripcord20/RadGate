import { ModuleScaffold } from '@/components/module-scaffold';

export default function TicketsPage() {
  return (
    <ModuleScaffold
      title="Manajemen Tiket"
      stage="Tahap 6"
      description="Tab: Baru, Dalam Proses, Selesai, Semua."
      columns={["No Tiket","Pelanggan","Judul","Prioritas","Teknisi","Status","Dibuat","Aksi"]}
      actions={["Buat Tiket","Export","Auto-Refresh"]}
      filters={["Semua Teknisi","Semua Prioritas","Semua Wilayah"]}
      endpoints={["GET /tickets"]}
    />
  );
}
