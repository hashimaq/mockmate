"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/features/dashboard/components/dashboard-card";
import {
  generateReportAction,
  getReportStatusAction,
} from "@/features/interviews/actions/interview-actions";
import { cn } from "@/lib/utils";
import type { ReportStatus } from "@/types/database";

const MESSAGES = [
  "Your interview has been submitted.",
  "Our AI is analyzing your answers.",
  "Scoring technical, communication, and problem-solving skills.",
  "This usually takes less than one minute.",
] as const;

type ReportProcessingViewProps = {
  interviewId: string;
  initialStatus: ReportStatus | "none";
  initialError?: string | null;
  canRetry: boolean;
};

export function ReportProcessingView({
  interviewId,
  initialStatus,
  initialError,
  canRetry,
}: ReportProcessingViewProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const kickedOff = useRef(false);
  const [status, setStatus] = useState<ReportStatus | "none">(initialStatus);
  const [errorMessage, setErrorMessage] = useState(initialError ?? null);
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(12);

  const isWorking = status === "pending" || status === "processing" || status === "none";
  const isFailed = status === "failed";

  useEffect(() => {
    if (!isWorking) return;
    const id = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
      setProgress((prev) => (prev >= 92 ? 18 : prev + 7));
    }, 2800);
    return () => clearInterval(id);
  }, [isWorking]);

  useEffect(() => {
    if (kickedOff.current) return;
    if (!canRetry) return;
    if (status === "completed" || status === "failed") return;

    kickedOff.current = true;
    setStatus((prev) => (prev === "none" ? "pending" : prev));

    void (async () => {
      const result = await generateReportAction({ interviewId });
      if (!result.success && result.reportStatus === "failed") {
        setStatus("failed");
        setErrorMessage(result.error ?? "Report generation failed");
        return;
      }
      if (result.reportReady) {
        setStatus("completed");
        toast.success("AI report ready");
        router.refresh();
      }
    })();
  }, [canRetry, interviewId, router, status]);

  useEffect(() => {
    if (!isWorking) return;

    let cancelled = false;

    const tick = async () => {
      const result = await getReportStatusAction({ interviewId });
      if (cancelled || !result.success) return;

      const next = result.reportStatus ?? "none";
      setStatus(next);
      setErrorMessage(result.error ?? null);

      if (next === "completed") {
        toast.success("AI report ready");
        router.refresh();
      }
    };

    const id = setInterval(() => {
      void tick();
    }, 2000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [interviewId, isWorking, router]);

  async function onRetry() {
    setErrorMessage(null);
    setStatus("pending");
    kickedOff.current = true;
    const result = await generateReportAction({ interviewId });
    if (!result.success) {
      toast.error(result.error ?? "Could not restart report generation");
      setStatus("failed");
      setErrorMessage(result.error ?? null);
      return;
    }
    toast.message("Report generation restarted");
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" className="-ml-2">
        <Link href="/dashboard/reports">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Reports
        </Link>
      </Button>

      <DashboardCard className="relative mx-auto max-w-xl overflow-hidden px-6 py-10 text-center sm:px-10">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-chart-2/10"
          aria-hidden
        />
        <div className="relative">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {isFailed ? (
              <Sparkles className="h-6 w-6" aria-hidden />
            ) : (
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
            )}
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            {isFailed ? "Needs attention" : "Generating AI report"}
          </p>

          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
            {isFailed ? "Report generation failed" : "Working on your feedback"}
          </h2>

          <div className="mt-4 min-h-[3.5rem]" aria-live="polite">
            <AnimatePresence mode="wait">
              <motion.p
                key={isFailed ? "error" : messageIndex}
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="text-sm leading-relaxed text-muted-foreground"
              >
                {isFailed
                  ? errorMessage ||
                    "Something went wrong while analyzing your answers. Your interview data is safe."
                  : MESSAGES[messageIndex]}
              </motion.p>
            </AnimatePresence>
          </div>

          {!isFailed ? (
            <div className="mx-auto mt-8 max-w-sm">
              <div
                className="h-2 overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
                aria-label="Report generation progress"
              >
                <div
                  className={cn(
                    "h-full rounded-full bg-primary transition-[width] duration-700 ease-out",
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Status:{" "}
                <span className="font-medium text-foreground">
                  {status === "none" ? "queued" : status}
                </span>
              </p>
            </div>
          ) : (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {canRetry ? (
                <Button onClick={onRetry}>Generate Report Again</Button>
              ) : null}
              <Button asChild variant="outline">
                <Link href={`/dashboard/interviews/${interviewId}`}>
                  Back to session
                </Link>
              </Button>
            </div>
          )}
        </div>
      </DashboardCard>
    </div>
  );
}
