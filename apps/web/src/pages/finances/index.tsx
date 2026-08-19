import { ModuleScaffold } from '@/components/module-scaffold';

export default function FinancesPage() {
  return (
    <ModuleScaffold
      title="Keuangan"
      stage="Tahap 4"
      description="Pemasukan, pengeluaran, dan profit per periode."
      columns={["Tanggal","Kategori","Jenis","Deskripsi","Nominal","Wilayah","Dibuat Oleh","Aksi"]}
      actions={["Tambah Transaksi","Kelola Kategori","Export"]}
      filters={["Semua Transaksi","Semua Kategori","Bulan","Tahun","Semua Wilayah"]}
      endpoints={["GET /finances","GET /finances/chart"]}
    />
  );
}
