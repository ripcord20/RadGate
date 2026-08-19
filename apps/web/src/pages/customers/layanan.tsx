import { ModuleScaffold } from '@/components/module-scaffold';

export default function CustomerLayananPage() {
  return (
    <ModuleScaffold
      title="Layanan"
      stage="Tahap 2"
      columns={["Nama Layanan","Tipe","Harga","Status","Aksi"]}
      endpoints={["GET /layanan"]}
    />
  );
}
