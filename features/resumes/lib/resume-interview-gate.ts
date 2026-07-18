import type { Resume, ResumeAnalysisStatus } from "@/types/database";

export type ResumeInterviewGate =
  | { state: "missing" }
  | { state: "processing" }
  | { state: "failed"; errorMessage: string | null }
  | { state: "ready" };

export function resolveResumeInterviewGate(
  resume: Resume | null,
): ResumeInterviewGate {
  if (!resume) {
    return { state: "missing" };
  }

  const status: ResumeAnalysisStatus = resume.analysis_status;

  if (status === "pending" || status === "processing") {
    return { state: "processing" };
  }

  if (status === "failed") {
    return { state: "failed", errorMessage: resume.error_message };
  }

  if (status === "completed") {
    return { state: "ready" };
  }

  return { state: "missing" };
}

export function isResumeInterviewTitle(title: string): boolean {
  return title.trim().toLowerCase().startsWith("resume ·");
}
