import { ModuleScaffold } from '@/components/module-scaffold';

export default function WhatsappTemplatePage() {
  return (
    <ModuleScaffold
      title="Template Pesan"
      stage="Tahap 7"
      columns={["Nama","Kategori","Isi","Variabel","Aksi"]}
      actions={["Tambah Template"]}
      endpoints={["GET /whatsapp/templates"]}
    />
  );
}
