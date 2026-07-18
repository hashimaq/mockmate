import type {
  ExperienceLevel,
  InterviewDifficulty,
  InterviewStatus,
  InterviewType,
} from "@/types/database";

export function formatInterviewType(type: InterviewType): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function formatExperienceLevel(level: ExperienceLevel): string {
  const map: Record<ExperienceLevel, string> = {
    intern: "Intern",
    junior: "Junior",
    mid: "Mid-Level",
    senior: "Senior",
  };
  return map[level];
}

export function formatDifficulty(level: InterviewDifficulty): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

export function formatStatus(status: InterviewStatus): string {
  const map: Record<InterviewStatus, string> = {
    draft: "Draft",
    in_progress: "In progress",
    completed: "Completed",
    abandoned: "Expired",
  };
  return map[status];
}

export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function remainingSeconds(expiresAt: string | null): number {
  if (!expiresAt) return 0;
  return Math.max(
    0,
    Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000),
  );
}
