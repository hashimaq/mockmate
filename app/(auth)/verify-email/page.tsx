import Link from "next/link";
import { Mail } from "lucide-react";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { Button } from "@/components/ui/button";

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
      description="We've sent a verification link to confirm your account."
      footer={
        <Link href="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Mail className="h-6 w-6" aria-hidden />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {email ? (
            <>
              A verification email was sent to{" "}
              <span className="font-medium text-foreground">{email}</span>.
              Open the link to activate your account.
            </>
          ) : (
            <>
              Open the verification link in your inbox to activate your account.
            </>
          )}
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/login">I&apos;ve verified — sign in</Link>
        </Button>
      </div>
    </AuthShell>
  );
}
