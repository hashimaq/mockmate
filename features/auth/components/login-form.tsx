"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

import { signInAction, type ActionResult } from "@/features/auth/actions/auth-actions";
import { AuthDivider } from "@/features/auth/components/auth-divider";
import { GoogleAuthButton } from "@/features/auth/components/google-auth-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";

type LoginFormProps = {
  nextPath?: string;
  initialMessage?: string | null;
  initialError?: string | null;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
      Sign in
    </Button>
  );
}

export function LoginForm({
  nextPath = "",
  initialMessage,
  initialError,
}: LoginFormProps) {
  const [rememberMe, setRememberMe] = useState(true);
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    signInAction,
    null,
  );

  const error = state?.error ?? initialError;
  const message = state?.message ?? initialMessage;

  return (
    <div>
      <GoogleAuthButton nextPath={nextPath} />
      <AuthDivider />

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={nextPath} />
        <input type="hidden" name="rememberMe" value={rememberMe ? "true" : "false"} />

        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {message ? (
          <Alert variant="success">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
          />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="rememberMe"
            checked={rememberMe}
            onCheckedChange={(value) => setRememberMe(value === true)}
          />
          <Label htmlFor="rememberMe" className="font-normal text-muted-foreground">
            Remember me
          </Label>
        </div>

        <SubmitButton />
      </form>
    </div>
  );
}
