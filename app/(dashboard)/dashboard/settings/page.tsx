import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SettingsView } from "@/features/settings/components/settings-view";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, getSessionUser } from "@/services/auth";
import { DEFAULT_VOICE_SETTINGS } from "@/services/voice/types";
import { VoiceSettingsService } from "@/services/voice/voice-settings-service";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function DashboardSettingsPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?next=/dashboard/settings");
  }

  const profile = await getCurrentProfile();

  if (!profile) {
    return (
      <div className="rounded-2xl border border-border/80 bg-card p-8 text-center">
        <h1 className="text-xl font-semibold">Profile unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We couldn&apos;t load your profile. Confirm the profiles migration has
          been run in Supabase, then refresh.
        </p>
      </div>
    );
  }

  let voiceSettings = DEFAULT_VOICE_SETTINGS;
  try {
    const supabase = await createClient();
    voiceSettings = await new VoiceSettingsService(supabase).getForUser(
      user.id,
    );
  } catch {
    voiceSettings = DEFAULT_VOICE_SETTINGS;
  }

  return (
    <SettingsView profile={profile} voiceSettings={voiceSettings} />
  );
}
