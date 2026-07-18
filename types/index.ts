export type {
  Profile,
  Database,
  Interview,
  Question,
  Answer,
  SeedQuestion,
  Report,
  ActivityLog,
  Resume,
  ResumeAnalysis,
  ResumeAnalysisStatus,
  InterviewType,
  InterviewDifficulty,
  InterviewStatus,
  ExperienceLevel,
  ReportStatus,
  UserRole,
  AccountStatus,
  AdminNotification,
  AdminNotificationStatus,
  PlatformFeedback,
  PlatformFeedbackCategory,
  PlatformFeedbackStatus,
  PlatformGeneralSettings,
} from "@/types/database";

export type NavLink = {
  href: string;
  label: string;
};

export type FeatureIconName =
  | "MessageSquare"
  | "Sparkles"
  | "TrendingUp"
  | "Briefcase"
  | "Clock"
  | "Shield";

export type Feature = {
  id: string;
  title: string;
  description: string;
  icon: FeatureIconName;
};

export type HowItWorksStep = {
  id: string;
  step: number;
  title: string;
  description: string;
};

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export type FooterLinkGroup = {
  title: string;
  links: ReadonlyArray<NavLink>;
};
