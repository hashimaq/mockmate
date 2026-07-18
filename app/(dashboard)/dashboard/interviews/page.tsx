import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { InterviewWizard } from "@/features/interviews/components/interview-wizard";
import { InterviewsList } from "@/features/interviews/components/interviews-list";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { ResumeAnalyzingCard } from "@/features/resumes/components/resume-analyzing-card";
import { buildResumeInterviewDefaults } from "@/features/resumes/lib/resume-interview-defaults";
import { resolveResumeInterviewGate } from "@/features/resumes/lib/resume-interview-gate";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/services/auth";
import { InterviewService } from "@/services/interviews/interview-service";
import { ResumeProvider } from "@/services/resumes/resume-provider";

export const metadata: Metadata = {
  title: "Interviews",
};

type InterviewsPageProps = {
  searchParams: Promise<{ mode?: string }>;
};

export default async function InterviewsPage({
  searchParams,
}: InterviewsPageProps) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?next=/dashboard/interviews");
  }

  const params = await searchParams;
  const resumeBased = params.mode === "resume";

  const supabase = await createClient();
  const interviews = await new InterviewService(supabase).listForUser(user.id);

  let resumeWizard: {
    defaults: ReturnType<typeof buildResumeInterviewDefaults>;
    summary: {
      careerLevel: string | null;
      yearsOfExperience: number | null;
      skills: string[];
      frameworks: string[];
      programmingLanguages: string[];
    };
  } | null = null;
  let resumeGate: ReturnType<typeof resolveResumeInterviewGate> | null = null;

  if (resumeBased) {
    const { resume, analysis } = await new ResumeProvider(
      supabase,
    ).getDashboard(user.id);
    resumeGate = resolveResumeInterviewGate(resume);

    if (resumeGate.state === "missing") {
      redirect("/dashboard/resume?required=1");
    }

    if (resumeGate.state === "ready" && analysis) {
      resumeWizard = {
        defaults: buildResumeInterviewDefaults(analysis),
        summary: {
          careerLevel: analysis.career_level,
          yearsOfExperience:
            analysis.years_of_experience === null
              ? null
              : Number(analysis.years_of_experience),
          skills: analysis.skills,
          frameworks: analysis.frameworks,
          programmingLanguages: analysis.programming_languages,
        },
      };
    }
  }

  const showResumeWizard = Boolean(resumeWizard);
  const showAnalyzing = resumeBased && resumeGate?.state === "processing";
  const showFailed = resumeBased && resumeGate?.state === "failed";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Interviews"
        description="Create a practice session, answer seed questions, and resume anytime. AI generation arrives later without changing this workflow."
      />

      {showAnalyzing ? <ResumeAnalyzingCard variant="processing" /> : null}
      {showFailed ? (
        <ResumeAnalyzingCard
          variant="failed"
          errorMessage={
            resumeGate?.state === "failed" ? resumeGate.errorMessage : null
          }
        />
      ) : null}

      {!showAnalyzing && !showFailed ? (
        <InterviewWizard
          resumeBased={showResumeWizard}
          initialValues={resumeWizard?.defaults}
          resumeSummary={resumeWizard?.summary}
        />
      ) : null}

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Your sessions</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Resume in-progress interviews or review completed ones.
          </p>
        </div>
        <InterviewsList interviews={interviews} />
      </section>
    </div>
  );
}
