"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

import { signUpAction, type ActionResult } from "@/features/auth/actions/auth-actions";
import { AuthDivider } from "@/features/auth/components/auth-divider";
import { GoogleAuthButton } from "@/features/auth/components/google-auth-button";
import {
  PASSWORD_REQUIREMENTS,
  PasswordRequirements,
} from "@/features/auth/components/password-requirements";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { cn } from "@/lib/utils";

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={disabled || pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
      Create account
    </Button>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-xs text-destructive" role="alert">
      {message}
    </p>
  );
}

function looksLikeEmailThrottle(message: string | undefined): boolean {
  if (!message) return false;
  const lower = message.toLowerCase();
  return (
    lower.includes("too many") ||
    lower.includes("rate limit") ||
    lower.includes("security purposes") ||
    lower.includes("only request this after") ||
    lower.includes("verification email may already")
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    signUpAction,
    null,
  );
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const passwordReady = useMemo(
    () => PASSWORD_REQUIREMENTS.every((item) => item.test(password)),
    [password],
  );
  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;
  const canSubmit =
    fullName.trim().length >= 2 &&
    email.includes("@") &&
    passwordReady &&
    passwordsMatch;

  // On error: keep name/email, clear only password fields
  useEffect(() => {
    if (!state || state.success) return;

    if (state.fields?.fullName !== undefined) setFullName(state.fields.fullName);
    if (state.fields?.email !== undefined) setEmail(state.fields.email);
    setPassword("");
    setConfirmPassword("");

    // Never strand users on a throttle error — continue to verify / sign-in path
    const emailForNext = state.fields?.email || email;
    if (looksLikeEmailThrottle(state.error) && emailForNext) {
      router.replace(
        `/verify-email?email=${encodeURIComponent(emailForNext)}`,
      );
    }
  }, [state, email, router]);

  const fieldErrors = state?.fieldErrors ?? {};
  const showError =
    state?.error && !looksLikeEmailThrottle(state.error) ? state.error : null;

  return (
    <div>
      <GoogleAuthButton label="Sign up with Google" />
      <AuthDivider />

      <form action={formAction} className="space-y-4" noValidate>
        {showError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{showError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            name="fullName"
            autoComplete="name"
            required
            placeholder="Ada Lovelace"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            aria-invalid={Boolean(fieldErrors.fullName)}
            className={cn(fieldErrors.fullName && "border-destructive")}
          />
          <FieldError message={fieldErrors.fullName} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(fieldErrors.email)}
            className={cn(fieldErrors.email && "border-destructive")}
          />
          <FieldError message={fieldErrors.email} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            required
            placeholder="Create a strong password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby="password-requirements"
            className={cn(fieldErrors.password && "border-destructive")}
          />
          <div id="password-requirements">
            <PasswordRequirements password={password} className="mt-2" />
          </div>
          <FieldError message={fieldErrors.password} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            autoComplete="new-password"
            required
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            aria-invalid={Boolean(fieldErrors.confirmPassword)}
            className={cn(fieldErrors.confirmPassword && "border-destructive")}
          />
          {confirmPassword && !passwordsMatch ? (
            <FieldError message="Passwords do not match" />
          ) : (
            <FieldError message={fieldErrors.confirmPassword} />
          )}
        </div>

        <SubmitButton disabled={!canSubmit} />
        {!canSubmit ? (
          <p className="text-center text-xs text-muted-foreground">
            Complete all fields and password requirements to continue.
          </p>
        ) : null}
      </form>
    </div>
  );
}
