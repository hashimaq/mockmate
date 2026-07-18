"use client";

import { useActionState, useEffect, useState } from "react";
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
import { cn } from "@/lib/utils";

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

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-xs text-destructive" role="alert">
      {message}
    </p>
  );
}

export function LoginForm({
  nextPath = "",
  initialMessage,
  initialError,
}: LoginFormProps) {
  const [rememberMe, setRememberMe] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    signInAction,
    null,
  );

  // On error: keep email, clear only password
  useEffect(() => {
    if (!state || state.success) return;
    if (state.fields?.email !== undefined) setEmail(state.fields.email);
    setPassword("");
  }, [state]);

  const error = state?.error ?? initialError;
  const message = state?.message ?? initialMessage;
  const fieldErrors = state?.fieldErrors ?? {};

  return (
    <div>
      <GoogleAuthButton nextPath={nextPath} />
      <AuthDivider />

      <form action={formAction} className="space-y-4" noValidate>
        <input type="hidden" name="next" value={nextPath} />
        <input
          type="hidden"
          name="rememberMe"
          value={rememberMe ? "true" : "false"}
        />

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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(fieldErrors.email)}
            className={cn(fieldErrors.email && "border-destructive")}
          />
          <FieldError message={fieldErrors.email} />
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
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={Boolean(fieldErrors.password)}
            className={cn(fieldErrors.password && "border-destructive")}
          />
          <FieldError message={fieldErrors.password} />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="rememberMe"
            checked={rememberMe}
            onCheckedChange={(value) => setRememberMe(value === true)}
          />
          <Label
            htmlFor="rememberMe"
            className="font-normal text-muted-foreground"
          >
            Remember me
          </Label>
        </div>

        <SubmitButton />
      </form>
    </div>
  );
}
