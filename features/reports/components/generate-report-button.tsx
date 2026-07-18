"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { generateReportAction } from "@/features/interviews/actions/interview-actions";

type GenerateReportButtonProps = {
  interviewId: string;
};

export function GenerateReportButton({ interviewId }: GenerateReportButtonProps) {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);

  return (
    <Button
      disabled={isStarting}
      onClick={async () => {
        if (isStarting) return;
        setIsStarting(true);
        try {
          const result = await generateReportAction({ interviewId });
          if (!result.success) {
            toast.error(result.error ?? "Could not start report generation");
            setIsStarting(false);
            return;
          }
          toast.message("Generating your AI report…");
          router.refresh();
        } catch {
          toast.error("Could not start report generation");
          setIsStarting(false);
        }
      }}
    >
      {isStarting ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <Sparkles className="h-4 w-4" aria-hidden />
      )}
      {isStarting ? "Starting…" : "Generate Report Again"}
    </Button>
  );
}
