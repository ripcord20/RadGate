import { ModuleScaffold } from '@/components/module-scaffold';

export default function WhatsappExternalApiPage() {
  return (
    <ModuleScaffold
      title="WhatsApp External API"
      stage="Tahap 7"
      description="Konfigurasi penyedia pihak ketiga sebagai alternatif gateway internal."
      actions={["Simpan"]}
      endpoints={["GET /whatsapp/providers"]}
    />
  );
}
