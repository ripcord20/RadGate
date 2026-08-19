import { ModuleScaffold } from '@/components/module-scaffold';

export default function SettingsImportPage() {
  return (
    <ModuleScaffold
      title="Import Data"
      stage="Tahap 2"
      description="Import dari Excel dan dari konfigurasi Mikrotik, dijalankan sebagai job."
      actions={["Unggah Berkas"]}
      endpoints={["POST /settings/import"]}
    />
  );
}
