import { ModuleScaffold } from '@/components/module-scaffold';

export default function ForgotPasswordPage() {
  return (
    <ModuleScaffold
      title="Lupa Password"
      stage="Tahap 0"
      endpoints={["POST /auth/forgot-password"]}
    />
  );
}
