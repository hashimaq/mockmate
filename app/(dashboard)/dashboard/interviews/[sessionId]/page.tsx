import { notFound, redirect } from "next/navigation";

import { InterviewSession } from "@/features/interviews/components/interview-session";
import { isResumeInterviewTitle } from "@/features/resumes/lib/resume-interview-gate";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/services/auth";
import { SessionService } from "@/services/sessions/session-service";
import { DEFAULT_VOICE_SETTINGS } from "@/services/voice/types";
import { VoiceSettingsService } from "@/services/voice/voice-settings-service";

type InterviewSessionPageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function InterviewSessionPage({
  params,
}: InterviewSessionPageProps) {
  const { sessionId } = await params;
  const user = await getSessionUser();
  if (!user) {
    redirect(`/login?next=/dashboard/interviews/${sessionId}`);
  }

  const supabase = await createClient();
  const session = await new SessionService(supabase).getSession(
    sessionId,
    user.id,
  );

  if (!session) {
    notFound();
  }

  let voiceSettings = DEFAULT_VOICE_SETTINGS;
  try {
    voiceSettings = await new VoiceSettingsService(supabase).getForUser(
      user.id,
    );
  } catch {
    voiceSettings = DEFAULT_VOICE_SETTINGS;
  }

  return (
    <InterviewSession
      interview={session.interview}
      questions={session.questions}
      answers={session.answers}
      isExpired={session.isExpired}
      isFinished={session.isFinished}
      hasReport={session.hasReport}
      isResumeInterview={isResumeInterviewTitle(session.interview.title)}
      voiceSettings={voiceSettings}
    />
  );
}
