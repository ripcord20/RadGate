import { ModuleScaffold } from '@/components/module-scaffold';

export default function ResetPasswordPage() {
  return (
    <ModuleScaffold
      title="Reset Password"
      stage="Tahap 0"
      endpoints={["POST /auth/reset-password"]}
    />
  );
}
