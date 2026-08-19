import { ModuleScaffold } from '@/components/module-scaffold';

export default function SettingsExportPage() {
  return (
    <ModuleScaffold
      title="Export Data"
      stage="Tahap 2"
      actions={["Export"]}
      endpoints={["GET /settings/export"]}
    />
  );
}
