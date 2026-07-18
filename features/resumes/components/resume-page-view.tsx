"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Download,
  Eye,
  FileText,
  Loader2,
  RefreshCw,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/features/dashboard/components/dashboard-card";
import { PageHeader } from "@/features/dashboard/components/page-header";
import {
  deleteResumeAction,
  getResumeSignedUrlAction,
  getResumeStatusAction,
  retryResumeAnalysisAction,
  uploadResumeAction,
} from "@/features/resumes/actions/resume-actions";
import { RESUME_BASED_INTERVIEW_HREF } from "@/features/resumes/lib/resume-interview-defaults";
import { cn } from "@/lib/utils";
import type { Resume, ResumeAnalysis, ResumeAnalysisStatus } from "@/types/database";

type ResumePageViewProps = {
  resume: Resume | null;
  analysis: ResumeAnalysis | null;
  signedUrl: string | null;
};

const STATUS_COPY: Record<ResumeAnalysisStatus, string> = {
  pending: "Queued for AI analysis",
  processing: "Extracting skills and experience…",
  completed: "Analysis ready",
  failed: "Analysis failed",
};

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function asProjectList(value: unknown): Array<{
  name: string;
  description?: string | null;
  technologies?: string[];
}> {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is { name: string; description?: string | null; technologies?: string[] } =>
      !!item &&
      typeof item === "object" &&
      "name" in item &&
      typeof (item as { name: unknown }).name === "string",
  );
}

function asExperienceList(value: unknown): Array<{
  company: string;
  title: string;
  duration?: string | null;
}> {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is { company: string; title: string; duration?: string | null } =>
      !!item &&
      typeof item === "object" &&
      "company" in item &&
      "title" in item &&
      typeof (item as { company: unknown }).company === "string" &&
      typeof (item as { title: unknown }).title === "string",
  );
}

export function ResumePageView({
  resume,
  analysis,
  signedUrl: initialSignedUrl,
}: ResumePageViewProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus] = useState<ResumeAnalysisStatus | "none">(
    resume?.analysis_status ?? "none",
  );
  const [errorMessage, setErrorMessage] = useState(resume?.error_message ?? null);

  const isWorking = status === "pending" || status === "processing";

  useEffect(() => {
    setStatus(resume?.analysis_status ?? "none");
    setErrorMessage(resume?.error_message ?? null);
  }, [resume?.analysis_status, resume?.error_message, resume?.id]);

  useEffect(() => {
    if (!resume || !isWorking) return;

    let cancelled = false;
    const tick = async () => {
      const result = await getResumeStatusAction();
      if (cancelled || !result.success) return;
      const next = result.status ?? "none";
      setStatus(next);
      setErrorMessage(result.error ?? null);
      if (next === "completed" || next === "failed") {
        router.refresh();
      }
    };

    void tick();
    const id = setInterval(() => {
      void tick();
    }, 2500);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [isWorking, resume, router]);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.set("resume", file);

    startTransition(async () => {
      const result = await uploadResumeAction(formData);
      if (!result.success) {
        toast.error(result.error ?? "Upload failed");
        return;
      }
      toast.success(result.message ?? "Resume uploaded");
      setStatus(result.status ?? "pending");
      router.refresh();
    });
  }

  function openSigned(mode: "preview" | "download") {
    startTransition(async () => {
      const result = await getResumeSignedUrlAction();
      if (!result.success || !result.signedUrl) {
        toast.error(result.error ?? "Could not open resume");
        return;
      }
      if (mode === "download") {
        const anchor = document.createElement("a");
        anchor.href = result.signedUrl;
        anchor.download = resume?.file_name ?? "resume";
        anchor.rel = "noopener";
        anchor.click();
        return;
      }
      window.open(result.signedUrl, "_blank", "noopener,noreferrer");
    });
  }

  function onDelete() {
    startTransition(async () => {
      const result = await deleteResumeAction();
      if (!result.success) {
        toast.error(result.error ?? "Delete failed");
        return;
      }
      toast.success(result.message ?? "Resume deleted");
      router.refresh();
    });
  }

  function onRetry() {
    startTransition(async () => {
      const result = await retryResumeAnalysisAction();
      if (!result.success) {
        toast.error(result.error ?? "Retry failed");
        return;
      }
      toast.success(result.message ?? "Analysis restarted");
      setStatus(result.status ?? "pending");
      router.refresh();
    });
  }

  const projects = asProjectList(analysis?.projects);
  const experience = asExperienceList(analysis?.work_experience);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Resume Intelligence"
        description="Upload one resume to personalize interview questions and report feedback."
      />

      <div
        id="resume-upload"
        className={cn(
          "rounded-2xl border border-dashed border-border/80 bg-gradient-to-br from-primary/[0.04] via-background to-emerald-500/[0.05] p-6 transition scroll-mt-24",
          dragOver && "border-primary bg-primary/[0.06]",
        )}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          handleFiles(event.dataTransfer.files);
        }}
      >
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {resume ? "Replace resume" : "Upload resume"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              PDF or DOCX · max 5 MB · one active resume per account
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="sr-only"
              onChange={(event) => {
                handleFiles(event.target.files);
                event.target.value = "";
              }}
            />
            <Button
              type="button"
              disabled={isPending}
              onClick={() => inputRef.current?.click()}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Upload className="h-4 w-4" aria-hidden />
              )}
              {resume ? "Replace file" : "Choose file"}
            </Button>
          </div>
        </div>
      </div>

      {!resume ? (
        <DashboardCard className="text-center">
          <FileText className="mx-auto h-10 w-10 text-primary/70" aria-hidden />
          <h2 className="mt-4 text-lg font-semibold text-foreground">
            No resume uploaded yet
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Upload a resume to unlock personalized AI interviews.
          </p>
        </DashboardCard>
      ) : (
        <>
          <DashboardCard>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-lg font-semibold text-foreground">
                    {resume.file_name}
                  </h2>
                  <Badge
                    variant={status === "completed" ? "secondary" : "outline"}
                    className={
                      status === "failed"
                        ? "border-destructive/40 text-destructive"
                        : undefined
                    }
                  >
                    {status === "none"
                      ? "No analysis"
                      : STATUS_COPY[status as ResumeAnalysisStatus]}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {formatBytes(resume.file_size)} · uploaded{" "}
                  {new Date(resume.uploaded_at).toLocaleString()}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => openSigned("preview")}
                >
                  <Eye className="h-4 w-4" aria-hidden />
                  Preview
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => openSigned("download")}
                >
                  <Download className="h-4 w-4" aria-hidden />
                  Download
                </Button>
                {status === "failed" ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isPending}
                    onClick={onRetry}
                  >
                    <RefreshCw className="h-4 w-4" aria-hidden />
                    Retry analysis
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  className="border-destructive/40 text-destructive hover:bg-destructive/10"
                  disabled={isPending}
                  onClick={onDelete}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  Delete
                </Button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {isWorking ? (
                <motion.div
                  key="processing"
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0 }}
                  className="mt-5 rounded-xl border border-border/70 bg-background/50 p-4"
                >
                  <div className="flex items-center gap-3">
                    <Loader2
                      className="h-5 w-5 animate-spin text-primary"
                      aria-hidden
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Analyzing your resume
                      </p>
                      <p className="text-xs text-muted-foreground">
                        This usually finishes in under a minute. You can keep
                        browsing.
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            {status === "failed" && errorMessage ? (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            ) : null}

            {initialSignedUrl ? (
              <p className="sr-only">
                Signed preview URL available for the current session.
              </p>
            ) : null}
          </DashboardCard>

          {analysis && status === "completed" ? (
            <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <DashboardCard className="xl:col-span-2">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                      Personalized practice
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-foreground">
                      Ready for a resume-based interview
                    </h3>
                    <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                      Opens the interview wizard with role and experience
                      pre-filled from this analysis. You can edit everything
                      before starting.
                    </p>
                  </div>
                  <Button asChild size="lg" className="shrink-0">
                    <Link href={RESUME_BASED_INTERVIEW_HREF}>
                      <Sparkles className="h-4 w-4" aria-hidden />
                      Start Resume-Based Interview
                    </Link>
                  </Button>
                </div>
              </DashboardCard>

              <DashboardCard>
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" aria-hidden />
                  <h3 className="text-base font-semibold text-foreground">
                    Experience summary
                  </h3>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {analysis.personal_summary ?? "No summary extracted."}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {analysis.career_level ? (
                    <Badge variant="outline">{analysis.career_level}</Badge>
                  ) : null}
                  {analysis.years_of_experience !== null ? (
                    <Badge variant="outline">
                      {Number(analysis.years_of_experience)} yrs experience
                    </Badge>
                  ) : null}
                </div>
                {experience.length > 0 ? (
                  <ul className="mt-5 space-y-2">
                    {experience.slice(0, 4).map((job, index) => (
                      <li
                        key={`${job.company}-${job.title}-${index}`}
                        className="rounded-xl border border-border/70 bg-background/40 px-3 py-2 text-sm"
                      >
                        <span className="font-medium text-foreground">
                          {job.title}
                        </span>
                        <span className="text-muted-foreground">
                          {" "}
                          · {job.company}
                          {job.duration ? ` (${job.duration})` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </DashboardCard>

              <DashboardCard className="text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Resume health score
                </p>
                <p className="mt-3 text-5xl font-semibold tracking-tight text-primary">
                  {analysis.health_score ?? "—"}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Clarity, impact, and completeness
                </p>
              </DashboardCard>

              <DashboardCard className="xl:col-span-2">
                <h3 className="text-base font-semibold text-foreground">
                  Extracted skills
                </h3>
                <TagGroup
                  label="Core skills"
                  items={analysis.skills}
                />
                <TagGroup
                  label="Languages"
                  items={analysis.programming_languages}
                />
                <TagGroup label="Frameworks" items={analysis.frameworks} />
                <TagGroup label="Tools" items={analysis.tools} />
                <TagGroup
                  label="Databases"
                  items={analysis.databases}
                />
                <TagGroup
                  label="Cloud"
                  items={analysis.cloud_platforms}
                />
              </DashboardCard>

              <DashboardCard className="xl:col-span-2">
                <h3 className="text-base font-semibold text-foreground">
                  Projects
                </h3>
                {projects.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    No projects were extracted from this resume.
                  </p>
                ) : (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {projects.slice(0, 6).map((project, index) => (
                      <div
                        key={`${project.name}-${index}`}
                        className="rounded-xl border border-border/70 bg-background/40 p-3"
                      >
                        <p className="text-sm font-medium text-foreground">
                          {project.name}
                        </p>
                        {project.description ? (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {project.description}
                          </p>
                        ) : null}
                        {(project.technologies?.length ?? 0) > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {project.technologies?.slice(0, 6).map((tech) => (
                              <Badge key={tech} variant="outline">
                                {tech}
                              </Badge>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </DashboardCard>

              <DashboardCard className="xl:col-span-2">
                <h3 className="text-base font-semibold text-foreground">
                  Suggestions
                </h3>
                {analysis.suggestions.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    No suggestions available.
                  </p>
                ) : (
                  <ol className="mt-4 space-y-3">
                    {analysis.suggestions.map((item, index) => (
                      <li
                        key={`${item}-${index}`}
                        className="flex gap-3 text-sm text-foreground"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                          {index + 1}
                        </span>
                        <span className="pt-1">{item}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </DashboardCard>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function TagGroup({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.slice(0, 24).map((item) => (
          <Badge key={`${label}-${item}`} variant="secondary">
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );
}
