import { ModuleScaffold } from '@/components/module-scaffold';

export default function BillingGeneratePage() {
  return (
    <ModuleScaffold
      title="Generate Tagihan"
      stage="Tahap 3"
      description="Berjalan sebagai job latar belakang. Idempoten lewat batasan unik pelanggan-periode."
      actions={["Jalankan"]}
      endpoints={["POST /invoices/generate"]}
    />
  );
}
