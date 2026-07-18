import { AuthShell } from "@/features/auth/components/auth-shell";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Choose a new password"
      description="Use a strong password you haven't used elsewhere."
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
