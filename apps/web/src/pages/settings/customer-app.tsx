import { ModuleScaffold } from '@/components/module-scaffold';

export default function CustomerAppPage() {
  return (
    <ModuleScaffold
      title="Aplikasi Pelanggan"
      stage="Setelah tahap inti"
      description="Branding, tautan unduh, dan fitur yang diaktifkan pada aplikasi mobile pelanggan."
      actions={["Simpan"]}
      endpoints={["GET /customer-app"]}
    />
  );
}
