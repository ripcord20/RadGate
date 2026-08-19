import { ModuleScaffold } from '@/components/module-scaffold';

export default function ReportsPage() {
  return (
    <ModuleScaffold
      title="Rekap Laporan"
      stage="Tahap 4"
      description="Tab: Rekap, Pelanggan, Keuangan, Tagihan. Dibaca dari snapshot harian, bukan tabel mentah."
      actions={["Export","Refresh"]}
      filters={["Rentang Tanggal","Semua Wilayah"]}
      endpoints={["GET /reports/summary"]}
    />
  );
}
