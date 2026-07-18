import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { InterviewWizard } from "@/features/interviews/components/interview-wizard";
import { InterviewsList } from "@/features/interviews/components/interviews-list";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { ResumeAnalyzingCard } from "@/features/resumes/components/resume-analyzing-card";
import { captureException } from "@/lib/monitoring/logger";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/services/auth";
import { InterviewService } from "@/services/interviews/interview-service";
import type { Interview } from "@/types/database";

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

  let interviews: Interview[] = [];
  try {
    const supabase = await createClient();
    interviews = await new InterviewService(supabase).listForUser(user.id);
  } catch (error) {
    captureException(error, { source: "InterviewsPage.listForUser" });
    interviews = [];
  }

  let resumeWizard: {
    defaults: {
      interviewType: "technical" | "hr" | "behavioral" | "mixed";
      roleTarget: string;
      customRole: string;
      experienceLevel: "intern" | "junior" | "mid" | "senior";
      difficulty: "easy" | "medium" | "hard";
      durationPreset: "10" | "20" | "30" | "custom";
      customDurationMinutes: string;
    };
    summary: {
      careerLevel: string | null;
      yearsOfExperience: number | null;
      skills: string[];
      frameworks: string[];
      programmingLanguages: string[];
    };
  } | null = null;
  let showAnalyzing = false;
  let showFailed = false;
  let failedMessage: string | null = null;

  if (resumeBased) {
    try {
      const { buildResumeInterviewDefaults } = await import(
        "@/features/resumes/lib/resume-interview-defaults"
      );
      const { resolveResumeInterviewGate } = await import(
        "@/features/resumes/lib/resume-interview-gate"
      );
      const { ResumeProvider } = await import(
        "@/services/resumes/resume-provider"
      );
      const supabase = await createClient();
      const { resume, analysis } = await new ResumeProvider(
        supabase,
      ).getDashboard(user.id);
      const resumeGate = resolveResumeInterviewGate(resume);

      if (resumeGate.state === "missing") {
        redirect("/dashboard/resume?required=1");
      }

      showAnalyzing = resumeGate.state === "processing";
      showFailed = resumeGate.state === "failed";
      failedMessage =
        resumeGate.state === "failed" ? resumeGate.errorMessage : null;

      if (resumeGate.state === "ready" && analysis) {
        resumeWizard = {
          defaults: buildResumeInterviewDefaults(analysis),
          summary: {
            careerLevel: analysis.career_level,
            yearsOfExperience:
              analysis.years_of_experience === null
                ? null
                : Number(analysis.years_of_experience),
            skills: analysis.skills ?? [],
            frameworks: analysis.frameworks ?? [],
            programmingLanguages: analysis.programming_languages ?? [],
          },
        };
      }
    } catch (error) {
      // redirect() throws — rethrow Next control flow
      if (
        typeof error === "object" &&
        error &&
        "digest" in error &&
        typeof (error as { digest?: unknown }).digest === "string" &&
        String((error as { digest: string }).digest).startsWith("NEXT_")
      ) {
        throw error;
      }
      captureException(error, { source: "InterviewsPage.resumeMode" });
    }
  }

  const showResumeWizard = Boolean(resumeWizard);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Interviews"
        description="Create a practice session, answer questions, and resume anytime with AI-powered feedback."
      />

      {showAnalyzing ? <ResumeAnalyzingCard variant="processing" /> : null}
      {showFailed ? (
        <ResumeAnalyzingCard
          variant="failed"
          errorMessage={failedMessage}
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
