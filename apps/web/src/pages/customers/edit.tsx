import { ModuleScaffold } from '@/components/module-scaffold';

export default function CustomerEditPage() {
  return (
    <ModuleScaffold
      title="Ubah Pelanggan"
      stage="Tahap 2"
      actions={["Simpan"]}
      endpoints={["PATCH /customers/:id"]}
    />
  );
}
