"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, Loader2, Trash2, Upload } from "lucide-react";
import { useTheme } from "next-themes";
import { useFormStatus } from "react-dom";

import {
  deleteAccountAction,
  updateEmailAction,
  updatePasswordAction,
  updateProfileAction,
  uploadAvatarAction,
  type ActionResult,
} from "@/features/auth/actions/auth-actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { VoiceSettingsCard } from "@/features/voice/components/voice-settings-card";
import type { VoiceSettingsInput } from "@/services/voice/types";
import type { Profile } from "@/types/database";

type SettingsViewProps = {
  profile: Profile;
  voiceSettings: VoiceSettingsInput;
};

const THEME_OPTIONS = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
] as const;

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
      {label}
    </Button>
  );
}

function ActionAlert({ state }: { state: ActionResult | null }) {
  if (!state) return null;
  if (state.error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{state.error}</AlertDescription>
      </Alert>
    );
  }
  if (state.success && state.message) {
    return (
      <Alert variant="success">
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription>{state.message}</AlertDescription>
      </Alert>
    );
  }
  return null;
}

function getInitials(name: string | null, email: string): string {
  if (name?.trim()) {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }
  return email.slice(0, 2).toUpperCase();
}

export function SettingsView({ profile, voiceSettings }: SettingsViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [profileState, profileAction] = useActionState(updateProfileAction, null);
  const [emailState, emailAction] = useActionState(updateEmailAction, null);
  const [passwordState, passwordAction] = useActionState(updatePasswordAction, null);
  const [avatarState, avatarAction] = useActionState(uploadAvatarAction, null);
  const [deletePending, startDelete] = useTransition();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="container-narrow section-padding py-10 sm:py-14">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your profile, security, and preferences.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile photo</CardTitle>
            <CardDescription>Upload a square image under 2MB.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={avatarAction} className="space-y-4">
              <ActionAlert state={avatarState} />
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <Avatar className="h-20 w-20 ring-1 ring-border">
                  {profile.avatar_url ? (
                    <AvatarImage
                      src={profile.avatar_url}
                      alt={profile.full_name ?? profile.email}
                    />
                  ) : null}
                  <AvatarFallback className="text-lg">
                    {getInitials(profile.full_name, profile.email)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    name="avatar"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) => {
                      if (event.currentTarget.files?.length) {
                        event.currentTarget.form?.requestSubmit();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" aria-hidden />
                    Upload photo
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Full name</CardTitle>
            <CardDescription>This is how you appear across MockMate.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={profileAction} className="space-y-4">
              <ActionAlert state={profileState} />
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  defaultValue={profile.full_name ?? ""}
                  required
                />
              </div>
              <SubmitButton label="Save name" />
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email</CardTitle>
            <CardDescription>
              Changing email may require confirmation from your inbox.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={emailAction} className="space-y-4">
              <ActionAlert state={emailState} />
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={profile.email}
                  required
                />
              </div>
              <SubmitButton label="Update email" />
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>
              Use a strong unique password for your MockMate account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={passwordAction} className="space-y-4">
              <ActionAlert state={passwordState} />
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current password</Label>
                <PasswordInput
                  id="currentPassword"
                  name="currentPassword"
                  autoComplete="current-password"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <PasswordInput
                  id="password"
                  name="password"
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <PasswordInput
                  id="confirmPassword"
                  name="confirmPassword"
                  autoComplete="new-password"
                  required
                />
              </div>
              <SubmitButton label="Update password" />
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Theme preference</CardTitle>
            <CardDescription>Choose how MockMate looks on this device.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Theme">
              {THEME_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={
                    mounted && theme === option.value ? "default" : "outline"
                  }
                  onClick={() => setTheme(option.value)}
                  aria-pressed={mounted ? theme === option.value : false}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <VoiceSettingsCard initialSettings={voiceSettings} />

        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-destructive">Delete account</CardTitle>
            <CardDescription>
              Permanently delete your account and profile data. This cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border-destructive/40 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  Delete account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently removes your MockMate account, profile, and avatar.
                    You will need to register again to come back.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={deletePending}
                    onClick={(event) => {
                      event.preventDefault();
                      startDelete(() => {
                        void deleteAccountAction();
                      });
                    }}
                  >
                    {deletePending ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : null}
                    Delete permanently
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
