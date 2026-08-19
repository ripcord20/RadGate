import { ModuleScaffold } from '@/components/module-scaffold';

export default function RegisterPage() {
  return (
    <ModuleScaffold
      title="Daftar Akun Baru"
      stage="Tahap 0"
      endpoints={["POST /auth/register"]}
    />
  );
}
