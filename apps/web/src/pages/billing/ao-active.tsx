import { ModuleScaffold } from '@/components/module-scaffold';

export default function AccountOfficerActivePage() {
  return (
    <ModuleScaffold
      title="AO Aktif"
      stage="Tahap 10"
      endpoints={["GET /account-officers/active"]}
    />
  );
}
