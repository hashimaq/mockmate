export type UserRole = "super_admin" | "admin" | "user";
export type AccountStatus = "active" | "suspended";

export type Profile = {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  role: UserRole;
  status: AccountStatus;
  created_at: string;
  updated_at: string;
};

export type InterviewType = "technical" | "behavioral" | "hr" | "mixed";
export type InterviewDifficulty = "easy" | "medium" | "hard";
export type InterviewStatus =
  | "draft"
  | "in_progress"
  | "completed"
  | "abandoned";
export type ExperienceLevel = "intern" | "junior" | "mid" | "senior";

export type Interview = {
  id: string;
  user_id: string;
  title: string;
  interview_type: InterviewType;
  role_target: string | null;
  experience_level: ExperienceLevel | null;
  difficulty: InterviewDifficulty;
  /** Optional target company for company-specific interviews. */
  target_company: string | null;
  status: InterviewStatus;
  score: number | null;
  duration_seconds: number;
  planned_duration_minutes: number | null;
  current_question_index: number;
  elapsed_seconds: number;
  started_at: string | null;
  completed_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Question = {
  id: string;
  interview_id: string;
  prompt: string;
  category: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type Answer = {
  id: string;
  question_id: string;
  interview_id: string;
  user_id: string;
  content: string;
  score: number | null;
  feedback: string | null;
  duration_seconds: number;
  is_draft: boolean;
  saved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SeedQuestion = {
  id: string;
  interview_type: InterviewType;
  role_target: string | null;
  experience_level: ExperienceLevel | null;
  difficulty: InterviewDifficulty;
  prompt: string;
  category: string | null;
  is_active: boolean;
  created_at: string;
};

export type ReportStatus = "pending" | "processing" | "completed" | "failed";

export type Report = {
  id: string;
  interview_id: string;
  user_id: string;
  overall_score: number | null;
  summary: string | null;
  strengths: string[];
  improvements: string[];
  metadata: Record<string, unknown>;
  status: ReportStatus;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ActivityLog = {
  id: string;
  user_id: string;
  interview_id: string | null;
  action: string;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type ResumeAnalysisStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export type Resume = {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
  analysis_status: ResumeAnalysisStatus;
  error_message: string | null;
  extracted_text: string | null;
  created_at: string;
  updated_at: string;
};

export type ResumeAnalysis = {
  id: string;
  resume_id: string;
  user_id: string;
  personal_summary: string | null;
  skills: string[];
  programming_languages: string[];
  frameworks: string[];
  libraries: string[];
  databases: string[];
  cloud_platforms: string[];
  tools: string[];
  projects: unknown[];
  work_experience: unknown[];
  education: unknown[];
  certifications: string[];
  soft_skills: string[];
  years_of_experience: number | null;
  career_level: string | null;
  health_score: number | null;
  suggestions: string[];
  raw_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type VoiceSettingsRow = {
  user_id: string;
  enable_voice_mode: boolean;
  auto_read_questions: boolean;
  speech_rate: number;
  preferred_voice: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminNotificationStatus = "unread" | "read" | "archived";

export type AdminNotification = {
  id: string;
  event_type: string;
  title: string;
  body: string | null;
  user_email: string | null;
  user_name: string | null;
  metadata: Record<string, unknown>;
  status: AdminNotificationStatus;
  created_at: string;
};

export type PlatformFeedbackCategory =
  | "contact"
  | "feature_request"
  | "bug_report"
  | "user_feedback";

export type PlatformFeedbackStatus =
  | "open"
  | "in_progress"
  | "resolved"
  | "archived";

export type PlatformFeedback = {
  id: string;
  category: PlatformFeedbackCategory;
  subject: string;
  message: string;
  submitter_email: string | null;
  submitter_name: string | null;
  user_id: string | null;
  status: PlatformFeedbackStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type PlatformGeneralSettings = {
  applicationName: string;
  supportEmail: string;
  notificationEmail: string;
  maintenanceMode: boolean;
};

export type PlatformSettingsRow = {
  key: string;
  value: Record<string, unknown>;
  updated_at: string;
  updated_by: string | null;
};

type TableDef<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: TableDef<
        Profile,
        {
          id: string;
          full_name?: string | null;
          email: string;
          avatar_url?: string | null;
          role?: UserRole;
          status?: AccountStatus;
          created_at?: string;
          updated_at?: string;
        },
        Partial<Profile>
      >;
      interviews: TableDef<
        Interview,
        {
          id?: string;
          user_id: string;
          title: string;
          interview_type?: InterviewType;
          role_target?: string | null;
          experience_level?: ExperienceLevel | null;
          difficulty?: InterviewDifficulty;
          target_company?: string | null;
          status?: InterviewStatus;
          score?: number | null;
          duration_seconds?: number;
          planned_duration_minutes?: number | null;
          current_question_index?: number;
          elapsed_seconds?: number;
          started_at?: string | null;
          completed_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        Partial<Interview>
      >;
      questions: TableDef<
        Question,
        {
          id?: string;
          interview_id: string;
          prompt: string;
          category?: string | null;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        },
        Partial<Question>
      >;
      answers: TableDef<
        Answer,
        {
          id?: string;
          question_id: string;
          interview_id: string;
          user_id: string;
          content?: string;
          score?: number | null;
          feedback?: string | null;
          duration_seconds?: number;
          is_draft?: boolean;
          saved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        Partial<Answer>
      >;
      seed_questions: TableDef<
        SeedQuestion,
        {
          id?: string;
          interview_type: InterviewType;
          role_target?: string | null;
          experience_level?: ExperienceLevel | null;
          difficulty: InterviewDifficulty;
          prompt: string;
          category?: string | null;
          is_active?: boolean;
          created_at?: string;
        },
        Partial<SeedQuestion>
      >;
      reports: TableDef<
        Report,
        {
          id?: string;
          interview_id: string;
          user_id: string;
          overall_score?: number | null;
          summary?: string | null;
          strengths?: string[];
          improvements?: string[];
          metadata?: Record<string, unknown>;
          status?: ReportStatus;
          error_message?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        Partial<Report>
      >;
      activity_logs: TableDef<
        ActivityLog,
        {
          id?: string;
          user_id: string;
          interview_id?: string | null;
          action: string;
          description?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
        },
        Partial<ActivityLog>
      >;
      resumes: TableDef<
        Resume,
        {
          id?: string;
          user_id: string;
          file_name: string;
          file_path: string;
          file_size: number;
          mime_type: string;
          uploaded_at?: string;
          analysis_status?: ResumeAnalysisStatus;
          error_message?: string | null;
          extracted_text?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        Partial<Resume>
      >;
      resume_analysis: TableDef<
        ResumeAnalysis,
        {
          id?: string;
          resume_id: string;
          user_id: string;
          personal_summary?: string | null;
          skills?: string[];
          programming_languages?: string[];
          frameworks?: string[];
          libraries?: string[];
          databases?: string[];
          cloud_platforms?: string[];
          tools?: string[];
          projects?: unknown[];
          work_experience?: unknown[];
          education?: unknown[];
          certifications?: string[];
          soft_skills?: string[];
          years_of_experience?: number | null;
          career_level?: string | null;
          health_score?: number | null;
          suggestions?: string[];
          raw_json?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        },
        Partial<ResumeAnalysis>
      >;
      voice_settings: TableDef<
        VoiceSettingsRow,
        {
          user_id: string;
          enable_voice_mode?: boolean;
          auto_read_questions?: boolean;
          speech_rate?: number;
          preferred_voice?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        Partial<VoiceSettingsRow>
      >;
      admin_notifications: TableDef<
        AdminNotification,
        {
          id?: string;
          event_type: string;
          title: string;
          body?: string | null;
          user_email?: string | null;
          user_name?: string | null;
          metadata?: Record<string, unknown>;
          status?: AdminNotificationStatus;
          created_at?: string;
        },
        Partial<AdminNotification>
      >;
      platform_feedback: TableDef<
        PlatformFeedback,
        {
          id?: string;
          category: PlatformFeedbackCategory;
          subject: string;
          message: string;
          submitter_email?: string | null;
          submitter_name?: string | null;
          user_id?: string | null;
          status?: PlatformFeedbackStatus;
          admin_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        Partial<PlatformFeedback>
      >;
      platform_settings: TableDef<
        PlatformSettingsRow,
        {
          key: string;
          value?: Record<string, unknown>;
          updated_at?: string;
          updated_by?: string | null;
        },
        Partial<PlatformSettingsRow>
      >;
    };
    Views: Record<string, never>;
    Functions: {
      is_staff: { Args: Record<string, never>; Returns: boolean };
      is_super_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
