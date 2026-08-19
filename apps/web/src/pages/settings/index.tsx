import { ModuleScaffold } from '@/components/module-scaffold';

export default function SettingsPage() {
  return (
    <ModuleScaffold
      title="Pengaturan Aplikasi"
      stage="Tahap 1"
      description="Informasi perusahaan, pajak, kebijakan sistem, dan integrasi pembayaran."
      actions={["Ganti Logo","Simpan Pengaturan"]}
      endpoints={["GET /settings","PATCH /settings"]}
    />
  );
}
