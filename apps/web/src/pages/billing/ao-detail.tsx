import { ModuleScaffold } from '@/components/module-scaffold';

export default function AccountOfficerDetailPage() {
  return (
    <ModuleScaffold
      title="Detail Account Officer"
      stage="Tahap 10"
      endpoints={["GET /account-officers/:id"]}
    />
  );
}
