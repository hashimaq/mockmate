import { JOB_ROLES } from "@/features/interviews/schemas/interview";
import type {
  ExperienceLevel,
  InterviewDifficulty,
  InterviewType,
  ResumeAnalysis,
} from "@/types/database";

export type ResumeInterviewWizardDefaults = {
  interviewType: InterviewType;
  roleTarget: string;
  customRole: string;
  experienceLevel: ExperienceLevel;
  difficulty: InterviewDifficulty;
  durationPreset: "10" | "20" | "30" | "custom";
  customDurationMinutes: string;
};

function asExperienceList(value: unknown): Array<{ title: string }> {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is { title: string } =>
      !!item &&
      typeof item === "object" &&
      "title" in item &&
      typeof (item as { title: unknown }).title === "string",
  );
}

export function mapCareerLevelToExperience(
  careerLevel: string | null,
  yearsOfExperience: number | null,
): ExperienceLevel {
  const level = (careerLevel ?? "").toLowerCase();

  if (
    level.includes("intern") ||
    level.includes("student") ||
    level.includes("trainee")
  ) {
    return "intern";
  }
  if (
    level.includes("junior") ||
    level.includes("entry") ||
    level.includes("associate")
  ) {
    return "junior";
  }
  if (
    level.includes("senior") ||
    level.includes("lead") ||
    level.includes("principal") ||
    level.includes("staff")
  ) {
    return "senior";
  }
  if (level.includes("mid") || level.includes("intermediate")) {
    return "mid";
  }

  if (yearsOfExperience !== null && !Number.isNaN(yearsOfExperience)) {
    if (yearsOfExperience < 1) return "intern";
    if (yearsOfExperience < 2) return "junior";
    if (yearsOfExperience < 5) return "mid";
    return "senior";
  }

  return "mid";
}

function resolveRole(analysis: ResumeAnalysis): {
  roleTarget: string;
  customRole: string;
} {
  const experience = asExperienceList(analysis.work_experience);
  const rawTitle = experience[0]?.title?.trim() ?? "";

  if (rawTitle) {
    const exact = JOB_ROLES.find(
      (role) => role.toLowerCase() === rawTitle.toLowerCase(),
    );
    if (exact) {
      return { roleTarget: exact, customRole: "" };
    }

    const partial = JOB_ROLES.find((role) => {
      const lower = role.toLowerCase();
      const title = rawTitle.toLowerCase();
      return title.includes(lower) || lower.includes(title);
    });
    if (partial) {
      return { roleTarget: partial, customRole: "" };
    }

    return {
      roleTarget: "__custom__",
      customRole: rawTitle.slice(0, 80),
    };
  }

  const skills = [
    ...analysis.programming_languages,
    ...analysis.frameworks,
    ...analysis.skills,
  ]
    .join(" ")
    .toLowerCase();

  if (skills.includes("react") || skills.includes("frontend")) {
    return { roleTarget: "Frontend Developer", customRole: "" };
  }
  if (skills.includes("node") || skills.includes("backend")) {
    return { roleTarget: "Backend Developer", customRole: "" };
  }
  if (skills.includes("python")) {
    return { roleTarget: "Python Developer", customRole: "" };
  }
  if (skills.includes("devops") || skills.includes("aws") || skills.includes("docker")) {
    return { roleTarget: "DevOps Engineer", customRole: "" };
  }

  return { roleTarget: "Full Stack Developer", customRole: "" };
}

function defaultInterviewType(analysis: ResumeAnalysis): InterviewType {
  const techSignal =
    analysis.programming_languages.length +
    analysis.frameworks.length +
    analysis.databases.length;

  if (techSignal >= 4) return "technical";
  if ((analysis.soft_skills?.length ?? 0) >= 4) return "behavioral";
  return "mixed";
}

/**
 * Prefills the existing interview wizard from completed resume analysis.
 * Users can still edit every field before starting.
 */
export function buildResumeInterviewDefaults(
  analysis: ResumeAnalysis,
): ResumeInterviewWizardDefaults {
  const role = resolveRole(analysis);
  const years =
    analysis.years_of_experience === null
      ? null
      : Number(analysis.years_of_experience);

  return {
    interviewType: defaultInterviewType(analysis),
    roleTarget: role.roleTarget,
    customRole: role.customRole,
    experienceLevel: mapCareerLevelToExperience(
      analysis.career_level,
      years,
    ),
    difficulty: "medium",
    durationPreset: "20",
    customDurationMinutes: "25",
  };
}

export const RESUME_BASED_INTERVIEW_HREF =
  "/dashboard/interviews?mode=resume" as const;
