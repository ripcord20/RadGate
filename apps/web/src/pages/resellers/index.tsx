import { ModuleScaffold } from '@/components/module-scaffold';

export default function ResellersPage() {
  return (
    <ModuleScaffold
      title="Reseller & Biller"
      stage="Tahap 10"
      description="Tab: Reseller, Biller."
      columns={["Nama","Telepon","Tipe","Komisi","Saldo","Wilayah","Status","Aksi"]}
      actions={["Tambah Reseller","Refresh"]}
      filters={["Semua Tipe","Semua Status","Semua Wilayah"]}
      endpoints={["GET /resellers"]}
    />
  );
}
