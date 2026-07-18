import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ResumeRequiredCard } from "@/features/resumes/components/resume-required-card";
import { ResumePageView } from "@/features/resumes/components/resume-page-view";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/services/auth";
import { ResumeProvider } from "@/services/resumes/resume-provider";

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
  const supabase = await createClient();
  const provider = new ResumeProvider(supabase);
  const payload = await provider.getDashboard(user.id);
  const showRequiredCard =
    params.required === "1" && payload.resume === null;

  return (
    <div className="space-y-6">
      {showRequiredCard ? <ResumeRequiredCard /> : null}
      <ResumePageView
        resume={payload.resume}
        analysis={payload.analysis}
        signedUrl={payload.signedUrl}
      />
    </div>
  );
}
