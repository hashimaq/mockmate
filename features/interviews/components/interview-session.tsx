"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flag,
  Hourglass,
  Loader2,
  Save,
} from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { EmptyState } from "@/features/dashboard/components/empty-state";
import { DashboardCard } from "@/features/dashboard/components/dashboard-card";
import {
  completeInterviewAction,
  saveAnswerAction,
  syncInterviewProgressAction,
} from "@/features/interviews/actions/interview-actions";
import {
  formatClock,
  formatDifficulty,
  formatExperienceLevel,
  formatInterviewType,
  remainingSeconds,
} from "@/features/interviews/lib/format";
import { CompanyAvatar } from "@/features/companies/components/company-avatar";
import { InterviewAnswerInput } from "@/features/voice/components/interview-answer-input";
import { cn } from "@/lib/utils";
import { DEFAULT_VOICE_SETTINGS, type VoiceSettingsInput } from "@/services/voice/types";
import type { Answer, Interview, Question } from "@/types/database";

const QuestionSpeechControls = dynamic(
  () =>
    import("@/features/voice/components/question-speech-controls").then(
      (mod) => mod.QuestionSpeechControls,
    ),
  { ssr: false },
);

type InterviewSessionProps = {
  interview: Interview;
  questions: Question[];
  answers: Answer[];
  isExpired: boolean;
  isFinished: boolean;
  hasReport: boolean;
  /** Subtle badge for resume-mode sessions only. */
  isResumeInterview?: boolean;
  voiceSettings?: VoiceSettingsInput;
};

type DraftMap = Record<
  string,
  {
    content: string;
    isDraft: boolean;
    savedContent: string;
  }
>;

function buildDraftMap(answers: Answer[]): DraftMap {
  return answers.reduce<DraftMap>((acc, answer) => {
    acc[answer.question_id] = {
      content: answer.content,
      isDraft: answer.is_draft,
      savedContent: answer.content,
    };
    return acc;
  }, {});
}

export function InterviewSession({
  interview,
  questions,
  answers,
  isExpired,
  isFinished,
  hasReport,
  isResumeInterview = false,
  voiceSettings = DEFAULT_VOICE_SETTINGS,
}: InterviewSessionProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(
    Math.min(interview.current_question_index, Math.max(questions.length - 1, 0)),
  );
  const [drafts, setDrafts] = useState<DraftMap>(() => buildDraftMap(answers));
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  // Prefer persisted elapsed for SSR/client first paint (avoids Date.now hydration drift)
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(
      0,
      (interview.planned_duration_minutes ?? 0) * 60 - interview.elapsed_seconds,
    ),
  );
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const busy = isPending || isFinishing;
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAtMs = useRef(
    interview.started_at ? new Date(interview.started_at).getTime() : Date.now(),
  );

  const currentQuestion = questions[index] ?? null;
  const currentDraft = currentQuestion
    ? drafts[currentQuestion.id] ?? {
        content: "",
        isDraft: true,
        savedContent: "",
      }
    : null;

  const dirty = useMemo(
    () =>
      Object.values(drafts).some(
        (draft) => draft.content !== draft.savedContent,
      ),
    [drafts],
  );

  const answeredCount = useMemo(
    () =>
      questions.filter((question) => {
        const draft = drafts[question.id];
        return Boolean(draft?.content.trim());
      }).length,
    [drafts, questions],
  );

  const progress =
    questions.length === 0 ? 0 : ((index + 1) / questions.length) * 100;

  const elapsedSeconds = useMemo(() => {
    const planned = (interview.planned_duration_minutes ?? 0) * 60;
    return Math.max(0, planned - secondsLeft);
  }, [interview.planned_duration_minutes, secondsLeft]);

  const persistAnswer = useCallback(
    async (questionId: string, content: string, isDraft: boolean) => {
      setSaveState("saving");
      const result = await saveAnswerAction({
        interviewId: interview.id,
        questionId,
        content,
        isDraft,
      });

      if (!result.success) {
        setSaveState("error");
        toast.error(result.error ?? "Could not save answer");
        return false;
      }

      setDrafts((prev) => ({
        ...prev,
        [questionId]: {
          content,
          isDraft,
          savedContent: content,
        },
      }));
      setSaveState("saved");
      return true;
    },
    [interview.id],
  );

  const queueAutosave = useCallback(
    (questionId: string, content: string) => {
      if (autosaveTimer.current) {
        clearTimeout(autosaveTimer.current);
      }
      autosaveTimer.current = setTimeout(() => {
        void persistAnswer(questionId, content, true);
      }, 1200);
    },
    [persistAnswer],
  );

  useEffect(() => {
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, []);

  useEffect(() => {
    if (isFinished || isExpired) return;

    const tick = () => {
      const left = remainingSeconds(interview.expires_at);
      setSecondsLeft(left);
      if (left <= 0) {
        toast.error("Interview time expired");
        router.refresh();
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [interview.expires_at, isExpired, isFinished, router]);

  useEffect(() => {
    if (isFinished || isExpired) return;

    const id = setInterval(() => {
      void syncInterviewProgressAction({
        interviewId: interview.id,
        currentQuestionIndex: index,
        elapsedSeconds: Math.floor((Date.now() - startedAtMs.current) / 1000),
      });
    }, 15000);

    return () => clearInterval(id);
  }, [index, interview.id, isExpired, isFinished]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty || isFinished || isExpired) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty, isExpired, isFinished]);

  function updateContent(value: string) {
    if (!currentQuestion || isFinished || isExpired) return;
    setDrafts((prev) => {
      const existing = prev[currentQuestion.id];
      return {
        ...prev,
        [currentQuestion.id]: {
          content: value,
          isDraft: true,
          savedContent: existing?.savedContent ?? "",
        },
      };
    });
    setSaveState("idle");
    queueAutosave(currentQuestion.id, value);
  }

  async function goToIndex(nextIndex: number) {
    if (!currentQuestion) {
      setIndex(nextIndex);
      return;
    }

    if (autosaveTimer.current) {
      clearTimeout(autosaveTimer.current);
      autosaveTimer.current = null;
    }

    const draft = drafts[currentQuestion.id];
    if (draft && draft.content !== draft.savedContent) {
      await persistAnswer(currentQuestion.id, draft.content, true);
    }

    setIndex(nextIndex);
    void syncInterviewProgressAction({
      interviewId: interview.id,
      currentQuestionIndex: nextIndex,
      elapsedSeconds,
    });
  }

  function requestLeave(href: string) {
    if (dirty && !isFinished && !isExpired) {
      setPendingHref(href);
      setLeaveOpen(true);
      return;
    }
    router.push(href);
  }

  function onManualSave() {
    if (!currentQuestion || !currentDraft) return;
    startTransition(async () => {
      const ok = await persistAnswer(
        currentQuestion.id,
        currentDraft.content,
        false,
      );
      if (ok) toast.success("Answer saved");
    });
  }

  async function onFinish() {
    if (isFinishing) return;
    setIsFinishing(true);
    setFinishOpen(false);

    try {
      if (currentQuestion && currentDraft) {
        if (autosaveTimer.current) {
          clearTimeout(autosaveTimer.current);
          autosaveTimer.current = null;
        }
        await persistAnswer(
          currentQuestion.id,
          currentDraft.content,
          false,
        );
      }

      const result = await completeInterviewAction({
        interviewId: interview.id,
        elapsedSeconds,
      });

      if (!result.success) {
        toast.error(result.error ?? "Could not finish interview");
        setIsFinishing(false);
        return;
      }

      toast.success(
        result.reportReady
          ? "Interview completed — opening report"
          : "Interview saved — generating your report…",
      );
      // Report page auto-starts AI evaluation (keeps Finish snappy)
      router.push(`/dashboard/reports/${interview.id}`);
    } catch {
      toast.error("Could not finish interview");
      setIsFinishing(false);
    }
  }

  if (isExpired) {
    return (
      <EmptyState
        icon={Hourglass}
        title="Interview expired"
        description="The allotted time for this session has ended. Start a new interview to continue practicing."
        actionLabel="Back to interviews"
        actionHref="/dashboard/interviews"
      />
    );
  }

  if (isFinished) {
    return (
      <EmptyState
        icon={CheckCircle2}
        title="Interview finished"
        description={
          hasReport
            ? "Your AI evaluation is ready. Review scores, strengths, and a personalized improvement plan."
            : "This session is complete. Generate or open your AI report when evaluation finishes."
        }
        actionLabel={hasReport ? "View AI Report" : "Open report page"}
        actionHref={`/dashboard/reports/${interview.id}`}
      />
    );
  }

  if (questions.length === 0) {
    return (
      <EmptyState
        icon={Flag}
        title="No questions available"
        description="Question generation did not return any prompts for this configuration. Try again or adjust role, type, or difficulty."
        actionLabel="Create another interview"
        actionHref="/dashboard/interviews"
      />
    );
  }

  return (
    <div className="relative space-y-5">
      <LoadingOverlay
        open={isFinishing}
        title="Submitting your interview"
        description="Saving answers and opening the report workspace. AI analysis runs in the background."
      />
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Button
            variant="ghost"
            className="-ml-2 mb-2"
            onClick={() => requestLeave("/dashboard/interviews")}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Interviews
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            {interview.target_company ? (
              <CompanyAvatar companyName={interview.target_company} />
            ) : null}
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {interview.title}
            </h1>
            {isResumeInterview ? (
              <Badge
                variant="outline"
                className="border-primary/25 bg-primary/[0.07] text-primary"
                aria-label="Resume Interview"
              >
                Resume Interview
              </Badge>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {interview.target_company ? (
              <span className="me-1">
                Target company: {interview.target_company} ·{" "}
              </span>
            ) : null}
            {formatInterviewType(interview.interview_type)}
            {interview.experience_level
              ? ` · ${formatExperienceLevel(interview.experience_level)}`
              : ""}
            {` · ${formatDifficulty(interview.difficulty)}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1.5">
            <Clock3 className="h-3.5 w-3.5" aria-hidden />
            <span aria-live="polite">{formatClock(secondsLeft)}</span>
          </Badge>
          <Badge variant="outline">
            Question {index + 1} of {questions.length}
          </Badge>
          <Badge
            variant={
              saveState === "error"
                ? "outline"
                : currentDraft?.content !== currentDraft?.savedContent
                  ? "secondary"
                  : "default"
            }
          >
            {saveState === "saving"
              ? "Saving…"
              : currentDraft && currentDraft.content !== currentDraft.savedContent
                ? "Unsaved changes"
                : currentDraft && !currentDraft.isDraft
                  ? "Saved"
                  : "Draft"}
          </Badge>
        </div>
      </div>

      <div
        className="h-2 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        aria-label="Interview progress"
      >
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: reduceMotion ? 0 : 0.25 }}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="space-y-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion?.id ?? "empty"}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <DashboardCard>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                  Question
                </p>
                <p className="mt-3 text-lg font-medium leading-relaxed text-foreground">
                  {currentQuestion?.prompt}
                </p>
                {currentQuestion?.category ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Category: {currentQuestion.category}
                  </p>
                ) : null}
                {currentQuestion ? (
                  <QuestionSpeechControls
                    questionText={currentQuestion.prompt}
                    questionId={currentQuestion.id}
                    autoRead={voiceSettings.autoReadQuestions}
                    speechRate={voiceSettings.speechRate}
                    preferredVoice={voiceSettings.preferredVoice}
                  />
                ) : null}
              </DashboardCard>

              <DashboardCard>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <label
                    htmlFor="answer"
                    className="text-sm font-semibold text-foreground"
                  >
                    Your answer
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Auto-saves as draft
                  </p>
                </div>
                <InterviewAnswerInput
                  voiceSettings={voiceSettings}
                  value={currentDraft?.content ?? ""}
                  onChange={updateContent}
                  disabled={isFinishing}
                />
                <p id="answer-help" className="sr-only">
                  Answers save automatically. Use Save Answer to mark as final draft.
                </p>
              </DashboardCard>
            </motion.div>
          </AnimatePresence>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => void goToIndex(Math.max(0, index - 1))}
                disabled={index === 0 || busy}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  void goToIndex(Math.min(questions.length - 1, index + 1))
                }
                disabled={index >= questions.length - 1 || busy}
              >
                Next
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={onManualSave}
                disabled={busy || !currentDraft}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Save className="h-4 w-4" aria-hidden />
                )}
                {isPending ? "Saving…" : "Save Answer"}
              </Button>
              <Button onClick={() => setFinishOpen(true)} disabled={busy}>
                {isFinishing ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Flag className="h-4 w-4" aria-hidden />
                )}
                {isFinishing ? "Evaluating…" : "Finish Interview"}
              </Button>
            </div>
          </div>
        </div>

        <DashboardCard className="h-fit">
          <p className="text-sm font-semibold text-foreground">Navigation</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {answeredCount} of {questions.length} answered
          </p>
          <ol className="mt-4 grid grid-cols-5 gap-2 lg:grid-cols-3">
            {questions.map((question, questionIndex) => {
              const draft = drafts[question.id];
              const hasAnswer = Boolean(draft?.content.trim());
              return (
                <li key={question.id}>
                  <button
                    type="button"
                    onClick={() => void goToIndex(questionIndex)}
                    disabled={busy}
                    aria-current={questionIndex === index ? "step" : undefined}
                    aria-label={`Go to question ${questionIndex + 1}`}
                    className={cn(
                      "flex h-10 w-full items-center justify-center rounded-lg border text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
                      questionIndex === index
                        ? "border-primary bg-primary text-primary-foreground"
                        : hasAnswer
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground hover:bg-accent",
                    )}
                  >
                    {questionIndex + 1}
                  </button>
                </li>
              );
            })}
          </ol>
          <Button asChild variant="link" className="mt-4 px-0">
            <Link
              href="/dashboard/interviews"
              onClick={(event) => {
                if (dirty) {
                  event.preventDefault();
                  requestLeave("/dashboard/interviews");
                }
              }}
            >
              Leave session
            </Link>
          </Button>
        </DashboardCard>
      </div>

      <AlertDialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave interview?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Drafts auto-save, but leaving now may
              discard the latest edits that have not synced yet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingHref) router.push(pendingHref);
              }}
            >
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={finishOpen} onOpenChange={setFinishOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finish this interview?</AlertDialogTitle>
            <AlertDialogDescription>
              You answered {answeredCount} of {questions.length} questions. You
              can still review the session afterward, but you cannot continue
              answering.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isFinishing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onFinish} disabled={isFinishing}>
              {isFinishing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Evaluating…
                </>
              ) : (
                "Finish interview"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
