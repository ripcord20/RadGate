import { ModuleScaffold } from '@/components/module-scaffold';

export default function ProfileEditPage() {
  return (
    <ModuleScaffold
      title="Ubah Profil"
      stage="Tahap 1"
      actions={["Simpan"]}
      endpoints={["PATCH /profile"]}
    />
  );
}
