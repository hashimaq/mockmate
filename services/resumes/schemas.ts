import { z } from "zod";

export const RESUME_MAX_BYTES = 5 * 1024 * 1024;

export const RESUME_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export type ResumeMimeType = (typeof RESUME_MIME_TYPES)[number];

export const resumeAnalysisStatusSchema = z.enum([
  "pending",
  "processing",
  "completed",
  "failed",
]);

export type ResumeAnalysisStatus = z.infer<typeof resumeAnalysisStatusSchema>;

const stringList = z.array(z.string().trim().min(1).max(120)).max(40);

const projectSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(800).optional().nullable(),
  technologies: stringList.optional().default([]),
});

const experienceSchema = z.object({
  company: z.string().trim().min(1).max(160),
  title: z.string().trim().min(1).max(160),
  duration: z.string().trim().max(120).optional().nullable(),
  highlights: stringList.optional().default([]),
});

const educationSchema = z.object({
  school: z.string().trim().min(1).max(200),
  degree: z.string().trim().max(200).optional().nullable(),
  year: z.string().trim().max(40).optional().nullable(),
});

export const geminiResumeAnalysisSchema = z.object({
  personalSummary: z.string().trim().min(20).max(2000),
  skills: stringList,
  programmingLanguages: stringList,
  frameworks: stringList,
  libraries: stringList,
  databases: stringList,
  cloudPlatforms: stringList,
  tools: stringList,
  projects: z.array(projectSchema).max(20),
  workExperience: z.array(experienceSchema).max(20),
  education: z.array(educationSchema).max(15),
  certifications: stringList,
  softSkills: stringList,
  yearsOfExperience: z.number().min(0).max(50),
  careerLevel: z.string().trim().min(2).max(40),
  healthScore: z.number().int().min(0).max(100),
  suggestions: z.array(z.string().trim().min(5).max(400)).min(1).max(10),
});

export type GeminiResumeAnalysis = z.infer<typeof geminiResumeAnalysisSchema>;

export type ResumeContextSummary = {
  personalSummary: string | null;
  skills: string[];
  programmingLanguages: string[];
  frameworks: string[];
  libraries: string[];
  databases: string[];
  cloudPlatforms: string[];
  tools: string[];
  projects: Array<{
    name: string;
    description?: string | null;
    technologies?: string[];
  }>;
  workExperience: Array<{
    company: string;
    title: string;
    duration?: string | null;
    highlights?: string[];
  }>;
  yearsOfExperience: number | null;
  careerLevel: string | null;
};
