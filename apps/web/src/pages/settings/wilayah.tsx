import { ModuleScaffold } from '@/components/module-scaffold';

export default function WilayahPage() {
  return (
    <ModuleScaffold
      title="Wilayah"
      stage="Tahap 1"
      description="Wilayah adalah batas otorisasi, bukan sekadar kategori."
      columns={["Nama","Kode","Jumlah Pelanggan","Status","Aksi"]}
      actions={["Tambah","Refresh"]}
      endpoints={["GET /wilayah"]}
    />
  );
}
