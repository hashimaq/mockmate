import Link from "next/link";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { LoginForm } from "@/features/auth/components/login-form";
import { getSafeRedirectPath } from "@/features/auth/lib/auth-utils";

type LoginPageProps = {
  searchParams: Promise<{
    next?: string;
    reset?: string;
    deleted?: string;
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  // Empty next → role-based home after login (staff → /admin, users → /dashboard).
  // Pass "" so email login uses resolvePostAuthPath; Google defaults to /dashboard.
  const nextPath = params.next
    ? getSafeRedirectPath(params.next, "/dashboard")
    : "";

  let initialMessage: string | null = null;
  if (params.reset === "success") {
    initialMessage = "Password updated. You can sign in with your new password.";
  }
  if (params.deleted === "1") {
    initialMessage = "Your account has been deleted.";
  }

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to continue your interview practice."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Get started
          </Link>
        </>
      }
    >
      <LoginForm
        nextPath={nextPath}
        initialMessage={initialMessage}
        initialError={params.error ? decodeURIComponent(params.error) : null}
      />
    </AuthShell>
  );
}
