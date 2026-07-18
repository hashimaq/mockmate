import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <AuthShell
      title="Unauthorized"
      description="You don't have permission to view this page."
    >
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <ShieldAlert className="h-6 w-6" aria-hidden />
        </div>
        <p className="text-sm text-muted-foreground">
          Sign in with an authorized account, or return to the home page.
        </p>
        <div className="mt-6 flex w-full flex-col gap-2 sm:flex-row">
          <Button asChild className="flex-1">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </div>
    </AuthShell>
  );
}
