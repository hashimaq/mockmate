import Link from "next/link";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { VerifyEmailPanel } from "@/features/auth/components/verify-email-panel";

type VerifyEmailPageProps = {
  searchParams: Promise<{ email?: string }>;
};

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const { email } = await searchParams;

  return (
    <AuthShell
      title="Check your email"
      description="Confirm your account with the verification link from Supabase Auth."
      footer={
        <Link href="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      <VerifyEmailPanel email={email} />
    </AuthShell>
  );
}
