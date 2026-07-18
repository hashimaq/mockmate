"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Briefcase,
  Building2,
  Clock3,
  Gauge,
  Layers,
  Loader2,
  Sparkles,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { CompanyAvatar } from "@/features/companies/components/company-avatar";
import { CompanyPicker } from "@/features/companies/components/company-picker";
import { createInterviewAction } from "@/features/interviews/actions/interview-actions";
import {
  JOB_ROLES,
  type CreateInterviewFormInput,
} from "@/features/interviews/schemas/interview";
import { DashboardCard } from "@/features/dashboard/components/dashboard-card";
import {
  CUSTOM_COMPANY_ID,
  NO_COMPANY_ID,
  getCompanyProfileById,
} from "@/services/companies/company-profiles";
import { cn } from "@/lib/utils";
import type {
  ExperienceLevel,
  InterviewDifficulty,
  InterviewType,
} from "@/types/database";

const STEPS = [
  "Type",
  "Role",
  "Company",
  "Experience",
  "Difficulty",
  "Duration",
] as const;

const INTERVIEW_TYPES: Array<{
  value: InterviewType;
  title: string;
  description: string;
}> = [
  {
    value: "technical",
    title: "Technical",
    description: "Coding concepts, systems, and problem-solving.",
  },
  {
    value: "hr",
    title: "HR",
    description: "Motivation, culture fit, and career narrative.",
  },
  {
    value: "behavioral",
    title: "Behavioral",
    description: "Past situations, teamwork, and decision-making.",
  },
  {
    value: "mixed",
    title: "Mixed",
    description: "A blend of technical and soft-skill prompts.",
  },
];

const EXPERIENCE_LEVELS: Array<{ value: ExperienceLevel; label: string }> = [
  { value: "intern", label: "Intern" },
  { value: "junior", label: "Junior" },
  { value: "mid", label: "Mid-Level" },
  { value: "senior", label: "Senior" },
];

const DIFFICULTIES: Array<{
  value: InterviewDifficulty | "adaptive";
  label: string;
  comingSoon?: boolean;
}> = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
  { value: "adaptive", label: "Adaptive", comingSoon: true },
];

const DURATIONS: Array<{ value: "10" | "20" | "30" | "custom"; label: string }> =
  [
    { value: "10", label: "10 Minutes" },
    { value: "20", label: "20 Minutes" },
    { value: "30", label: "30 Minutes" },
    { value: "custom", label: "Custom" },
  ];

type WizardState = {
  interviewType: InterviewType | null;
  roleTarget: string;
  customRole: string;
  companyId: string;
  customCompanyName: string;
  experienceLevel: ExperienceLevel | null;
  difficulty: InterviewDifficulty | null;
  durationPreset: "10" | "20" | "30" | "custom" | null;
  customDurationMinutes: string;
};

const initialState: WizardState = {
  interviewType: null,
  roleTarget: "",
  customRole: "",
  companyId: NO_COMPANY_ID,
  customCompanyName: "",
  experienceLevel: null,
  difficulty: null,
  durationPreset: null,
  customDurationMinutes: "25",
};

export type ResumeWizardSummary = {
  careerLevel: string | null;
  yearsOfExperience: number | null;
  skills: string[];
  frameworks: string[];
  programmingLanguages: string[];
};

export type InterviewWizardProps = {
  /** When true, wizard was opened from Resume Intelligence. */
  resumeBased?: boolean;
  /** Optional prefilled values (user can still edit every step). */
  initialValues?: Partial<WizardState>;
  /** Display-only resume highlights (not locked fields). */
  resumeSummary?: ResumeWizardSummary;
};

export function InterviewWizard({
  resumeBased = false,
  initialValues,
  resumeSummary,
}: InterviewWizardProps = {}) {
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState(0);
  const [state, setState] = useState<WizardState>(() => ({
    ...initialState,
    ...initialValues,
  }));
  const [isGenerating, setIsGenerating] = useState(false);

  const resolvedRole =
    state.roleTarget === "__custom__"
      ? state.customRole.trim()
      : state.roleTarget;

  const resolvedCompanyName =
    state.companyId === CUSTOM_COMPANY_ID
      ? state.customCompanyName.trim()
      : state.companyId === NO_COMPANY_ID
        ? null
        : (getCompanyProfileById(state.companyId)?.name ?? null);

  function canContinue(): boolean {
    if (step === 0) return Boolean(state.interviewType);
    if (step === 1) return resolvedRole.length >= 2;
    if (step === 2) {
      if (state.companyId === CUSTOM_COMPANY_ID) {
        return state.customCompanyName.trim().length >= 2;
      }
      return Boolean(state.companyId);
    }
    if (step === 3) return Boolean(state.experienceLevel);
    if (step === 4) return Boolean(state.difficulty);
    if (step === 5) {
      if (!state.durationPreset) return false;
      if (state.durationPreset !== "custom") return true;
      const minutes = Number(state.customDurationMinutes);
      return Number.isInteger(minutes) && minutes >= 5 && minutes <= 120;
    }
    return false;
  }

  function buildPayload(): CreateInterviewFormInput | null {
    if (
      !state.interviewType ||
      !state.experienceLevel ||
      !state.difficulty ||
      !state.durationPreset
    ) {
      return null;
    }

    return {
      interviewType: state.interviewType,
      roleTarget: resolvedRole,
      experienceLevel: state.experienceLevel,
      difficulty: state.difficulty,
      durationPreset: state.durationPreset,
      customDurationMinutes:
        state.durationPreset === "custom"
          ? Number(state.customDurationMinutes)
          : undefined,
      resumeMode: resumeBased,
      companyId: state.companyId,
      customCompanyName: state.customCompanyName,
    };
  }

  async function onStart() {
    const payload = buildPayload();
    if (!payload || isGenerating) {
      if (!payload) {
        toast.error("Complete all wizard steps before starting.");
      }
      return;
    }

    setIsGenerating(true);
    try {
      const result = await createInterviewAction(payload);
      if (!result.success) {
        toast.error(result.error ?? "Could not start interview");
        setIsGenerating(false);
      }
      // On success the action redirects — keep overlay until navigation.
    } catch {
      toast.error("Could not start interview");
      setIsGenerating(false);
    }
  }

  return (
    <DashboardCard className="relative overflow-hidden">
      <LoadingOverlay
        open={isGenerating}
        variant="absolute"
        title="Generating interview questions"
        description="Gemini is building role-specific questions for your session. This usually takes a few seconds."
      />
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            {resumeBased ? "Resume-based interview" : "Create interview"}
          </p>
          <h2 className="mt-1 text-xl font-semibold text-foreground">
            Interview setup wizard
          </h2>
          {resumeBased ? (
            <div
              className="mt-3 rounded-xl border border-primary/20 bg-primary/[0.06] px-3 py-2 text-sm text-foreground"
              role="status"
            >
              Your interview has been personalized using your uploaded resume.
            </div>
          ) : null}
          {resumeBased && resumeSummary ? (
            <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Resume highlights">
              {resumeSummary.careerLevel ? (
                <span className="rounded-full border border-border/70 bg-background/60 px-2.5 py-1 text-xs text-muted-foreground">
                  Career: {resumeSummary.careerLevel}
                </span>
              ) : null}
              {resumeSummary.yearsOfExperience !== null ? (
                <span className="rounded-full border border-border/70 bg-background/60 px-2.5 py-1 text-xs text-muted-foreground">
                  {resumeSummary.yearsOfExperience} yrs experience
                </span>
              ) : null}
              {resumeSummary.programmingLanguages.slice(0, 4).map((item) => (
                <span
                  key={`lang-${item}`}
                  className="rounded-full border border-border/70 bg-background/60 px-2.5 py-1 text-xs text-muted-foreground"
                >
                  {item}
                </span>
              ))}
              {resumeSummary.frameworks.slice(0, 4).map((item) => (
                <span
                  key={`fw-${item}`}
                  className="rounded-full border border-border/70 bg-background/60 px-2.5 py-1 text-xs text-muted-foreground"
                >
                  {item}
                </span>
              ))}
              {resumeSummary.skills.slice(0, 4).map((item) => (
                <span
                  key={`skill-${item}`}
                  className="rounded-full border border-border/70 bg-background/60 px-2.5 py-1 text-xs text-muted-foreground"
                >
                  {item}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <ol className="flex flex-wrap gap-2" aria-label="Wizard progress">
          {STEPS.map((label, index) => (
            <li
              key={label}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-medium",
                index === step
                  ? "bg-primary text-primary-foreground"
                  : index < step
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {index + 1}. {label}
            </li>
          ))}
        </ol>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
        >
          {step === 0 ? (
            <StepShell
              icon={Layers}
              title="Select interview type"
              description="Choose the focus for this practice session."
            >
              <OptionGrid role="radiogroup" ariaLabel="Interview type">
                {INTERVIEW_TYPES.map((item) => (
                  <OptionButton
                    key={item.value}
                    selected={state.interviewType === item.value}
                    title={item.title}
                    description={item.description}
                    onClick={() =>
                      setState((prev) => ({
                        ...prev,
                        interviewType: item.value,
                      }))
                    }
                  />
                ))}
              </OptionGrid>
            </StepShell>
          ) : null}

          {step === 1 ? (
            <StepShell
              icon={Briefcase}
              title="Choose job role"
              description="Pick a common role or enter a custom one."
            >
              <OptionGrid role="radiogroup" ariaLabel="Job role">
                {JOB_ROLES.map((role) => (
                  <OptionButton
                    key={role}
                    selected={state.roleTarget === role}
                    title={role}
                    onClick={() =>
                      setState((prev) => ({
                        ...prev,
                        roleTarget: role,
                        customRole: "",
                      }))
                    }
                  />
                ))}
                <OptionButton
                  selected={state.roleTarget === "__custom__"}
                  title="Custom role"
                  description="Type any target role for this session."
                  onClick={() =>
                    setState((prev) => ({
                      ...prev,
                      roleTarget: "__custom__",
                    }))
                  }
                />
              </OptionGrid>
              {state.roleTarget === "__custom__" ? (
                <div className="mt-4 space-y-2">
                  <Label htmlFor="custom-role">Custom role</Label>
                  <Input
                    id="custom-role"
                    value={state.customRole}
                    onChange={(event) =>
                      setState((prev) => ({
                        ...prev,
                        customRole: event.target.value,
                      }))
                    }
                    placeholder="e.g. Platform Engineer"
                    autoFocus
                  />
                </div>
              ) : null}
            </StepShell>
          ) : null}

          {step === 2 ? (
            <StepShell
              icon={Building2}
              title="Target company"
              description="Optional — adapt questions to a company's hiring style."
            >
              <CompanyPicker
                companyId={state.companyId}
                customCompanyName={state.customCompanyName}
                onCompanyIdChange={(companyId) =>
                  setState((prev) => ({ ...prev, companyId }))
                }
                onCustomCompanyNameChange={(customCompanyName) =>
                  setState((prev) => ({ ...prev, customCompanyName }))
                }
              />
            </StepShell>
          ) : null}

          {step === 3 ? (
            <StepShell
              icon={UserRound}
              title="Experience level"
              description="We use this to select appropriately scoped seed questions."
            >
              <OptionGrid
                columns="four"
                role="radiogroup"
                ariaLabel="Experience level"
              >
                {EXPERIENCE_LEVELS.map((item) => (
                  <OptionButton
                    key={item.value}
                    selected={state.experienceLevel === item.value}
                    title={item.label}
                    onClick={() =>
                      setState((prev) => ({
                        ...prev,
                        experienceLevel: item.value,
                      }))
                    }
                  />
                ))}
              </OptionGrid>
            </StepShell>
          ) : null}

          {step === 4 ? (
            <StepShell
              icon={Gauge}
              title="Difficulty"
              description="Adaptive mode will arrive with the AI evaluation phase."
            >
              <OptionGrid
                columns="four"
                role="radiogroup"
                ariaLabel="Difficulty"
              >
                {DIFFICULTIES.map((item) => (
                  <OptionButton
                    key={item.value}
                    selected={
                      !item.comingSoon && state.difficulty === item.value
                    }
                    title={item.label}
                    description={
                      item.comingSoon ? "Coming soon" : undefined
                    }
                    disabled={item.comingSoon}
                    onClick={() => {
                      if (item.comingSoon || item.value === "adaptive") return;
                      setState((prev) => ({
                        ...prev,
                        difficulty: item.value as InterviewDifficulty,
                      }));
                    }}
                  />
                ))}
              </OptionGrid>
            </StepShell>
          ) : null}

          {step === 5 ? (
            <StepShell
              icon={Clock3}
              title="Interview duration"
              description="The timer starts when you begin the session."
            >
              <div
                className="mb-5 rounded-xl border border-border/70 bg-background/50 p-4"
                aria-label="Interview summary"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                  Interview summary
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {resolvedCompanyName ? (
                    <div className="flex items-center gap-2">
                      <CompanyAvatar companyName={resolvedCompanyName} />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Target company
                        </p>
                        <p className="text-sm font-medium text-foreground">
                          {resolvedCompanyName}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No target company selected
                    </p>
                  )}
                  {resolvedRole ? (
                    <p className="text-sm text-muted-foreground">
                      Role:{" "}
                      <span className="font-medium text-foreground">
                        {resolvedRole}
                      </span>
                    </p>
                  ) : null}
                </div>
              </div>
              <OptionGrid
                columns="four"
                role="radiogroup"
                ariaLabel="Interview duration"
              >
                {DURATIONS.map((item) => (
                  <OptionButton
                    key={item.value}
                    selected={state.durationPreset === item.value}
                    title={item.label}
                    onClick={() =>
                      setState((prev) => ({
                        ...prev,
                        durationPreset: item.value,
                      }))
                    }
                  />
                ))}
              </OptionGrid>
              {state.durationPreset === "custom" ? (
                <div className="mt-4 space-y-2">
                  <Label htmlFor="custom-duration">Minutes (5–120)</Label>
                  <Input
                    id="custom-duration"
                    type="number"
                    min={5}
                    max={120}
                    value={state.customDurationMinutes}
                    onChange={(event) =>
                      setState((prev) => ({
                        ...prev,
                        customDurationMinutes: event.target.value,
                      }))
                    }
                  />
                </div>
              ) : null}
            </StepShell>
          ) : null}
        </motion.div>
      </AnimatePresence>

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="outline"
          onClick={() => setStep((prev) => Math.max(0, prev - 1))}
          disabled={step === 0 || isGenerating}
        >
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button
            onClick={() => setStep((prev) => Math.min(STEPS.length - 1, prev + 1))}
            disabled={!canContinue() || isGenerating}
          >
            Continue
          </Button>
        ) : (
          <Button onClick={onStart} disabled={!canContinue() || isGenerating}>
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Sparkles className="h-4 w-4" aria-hidden />
            )}
            {isGenerating ? "Generating…" : "Start Interview"}
          </Button>
        )}
      </div>
    </DashboardCard>
  );
}

function StepShell({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Layers;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function OptionGrid({
  children,
  columns = "two",
  role,
  ariaLabel,
}: {
  children: ReactNode;
  columns?: "two" | "four";
  role?: "radiogroup";
  ariaLabel?: string;
}) {
  return (
    <div
      role={role}
      aria-label={ariaLabel}
      className={cn(
        "grid gap-3",
        columns === "two" && "sm:grid-cols-2",
        columns === "four" && "sm:grid-cols-2 lg:grid-cols-4",
      )}
    >
      {children}
    </div>
  );
}

function OptionButton({
  selected,
  title,
  description,
  onClick,
  disabled,
}: {
  selected: boolean;
  title: string;
  description?: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="radio"
      disabled={disabled}
      onClick={onClick}
      aria-checked={selected}
      className={cn(
        "rounded-xl border px-4 py-3.5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "border-primary bg-primary/10 shadow-sm shadow-primary/10"
          : "border-border/80 bg-background/60 hover:border-primary/30 hover:bg-accent/40",
        disabled && "cursor-not-allowed opacity-55 hover:border-border/80 hover:bg-background/60",
      )}
    >
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description ? (
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
    </button>
  );
}
