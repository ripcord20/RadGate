import { ModuleScaffold } from '@/components/module-scaffold';

export default function CustomerAddPage() {
  return (
    <ModuleScaffold
      title="Tambah Pelanggan"
      stage="Tahap 2"
      description="Empat seksi: Layanan Internet, Akun Aplikasi, Informasi Personal, Inventory Barang Keluar."
      actions={["Simpan"]}
      endpoints={["POST /customers"]}
    />
  );
}
