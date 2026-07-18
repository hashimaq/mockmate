"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2, Mail } from "lucide-react";
import { useFormStatus } from "react-dom";

import {
  resendVerificationEmailAction,
  type ActionResult,
} from "@/features/auth/actions/auth-actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function ResendButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
      Resend verification email
    </Button>
  );
}

export function VerifyEmailPanel({ email }: { email?: string }) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    resendVerificationEmailAction,
    null,
  );

  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Mail className="h-6 w-6" aria-hidden />
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {email ? (
          <>
            We use Supabase Auth to email{" "}
            <span className="font-medium text-foreground">{email}</span>. Check
            inbox and spam. If nothing arrives, resend below.
          </>
        ) : (
          <>
            Enter your email and resend the verification link. Also check spam.
          </>
        )}
      </p>

      <form action={formAction} className="mt-6 w-full max-w-sm space-y-3 text-left">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            defaultValue={email ?? ""}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>

        {state?.error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        ) : null}

        {state?.message ? (
          <Alert variant="success">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        ) : null}

        <ResendButton />
      </form>

      <Button asChild variant="outline" className="mt-4 w-full max-w-sm">
        <Link href="/login">Go to sign in</Link>
      </Button>
    </div>
  );
}
