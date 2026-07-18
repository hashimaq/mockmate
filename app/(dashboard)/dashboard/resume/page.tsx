import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ResumeRequiredCard } from "@/features/resumes/components/resume-required-card";
import { ResumePageView } from "@/features/resumes/components/resume-page-view";
import { captureException } from "@/lib/monitoring/logger";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/services/auth";
import type { Resume, ResumeAnalysis } from "@/types/database";

export const metadata: Metadata = {
  title: "Resume",
};

type ResumePageProps = {
  searchParams: Promise<{ required?: string }>;
};

export default async function DashboardResumePage({
  searchParams,
}: ResumePageProps) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?next=/dashboard/resume");
  }

  const params = await searchParams;

  let resume: Resume | null = null;
  let analysis: ResumeAnalysis | null = null;
  let signedUrl: string | null = null;

  try {
    const { ResumeProvider } = await import(
      "@/services/resumes/resume-provider"
    );
    const supabase = await createClient();
    const payload = await new ResumeProvider(supabase).getDashboard(user.id);
    resume = payload.resume;
    analysis = payload.analysis;
    signedUrl = payload.signedUrl;
  } catch (error) {
    captureException(error, { source: "DashboardResumePage" });
  }

  const showRequiredCard = params.required === "1" && resume === null;

  return (
    <div className="space-y-6">
      {showRequiredCard ? <ResumeRequiredCard /> : null}
      <ResumePageView
        resume={resume}
        analysis={analysis}
        signedUrl={signedUrl}
      />
    </div>
  );
}
