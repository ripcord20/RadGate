import { ModuleScaffold } from '@/components/module-scaffold';

export default function ProfilePage() {
  return (
    <ModuleScaffold
      title="Profil Saya"
      stage="Tahap 1"
      endpoints={["GET /profile"]}
    />
  );
}
