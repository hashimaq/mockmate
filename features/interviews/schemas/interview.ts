import { z } from "zod";

import {
  CUSTOM_COMPANY_ID,
  NO_COMPANY_ID,
  getCompanyProfileById,
} from "@/services/companies/company-profiles";
import { sanitizeCompanyName } from "@/services/companies/company-utils";

export const interviewTypeSchema = z.enum([
  "technical",
  "hr",
  "behavioral",
  "mixed",
]);

export const experienceLevelSchema = z.enum([
  "intern",
  "junior",
  "mid",
  "senior",
]);

export const difficultySchema = z.enum(["easy", "medium", "hard"]);

export const durationPresetSchema = z.enum(["10", "20", "30", "custom"]);

export const createInterviewSchema = z
  .object({
    interviewType: interviewTypeSchema,
    roleTarget: z.string().trim().min(2, "Select or enter a job role").max(80),
    experienceLevel: experienceLevelSchema,
    difficulty: difficultySchema,
    durationPreset: durationPresetSchema,
    customDurationMinutes: z.coerce.number().int().optional(),
    /** When true, questions use completed resume analysis + wizard settings. */
    resumeMode: z.boolean().optional().default(false),
    /** Optional company profile id, "__none__", or "__custom__". */
    companyId: z.string().trim().max(80).optional().default(NO_COMPANY_ID),
    customCompanyName: z.string().trim().max(80).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.durationPreset === "custom") {
      if (
        data.customDurationMinutes === undefined ||
        Number.isNaN(data.customDurationMinutes) ||
        data.customDurationMinutes < 5 ||
        data.customDurationMinutes > 120
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["customDurationMinutes"],
          message: "Custom duration must be between 5 and 120 minutes",
        });
      }
    }

    if (data.companyId === CUSTOM_COMPANY_ID) {
      const custom = sanitizeCompanyName(data.customCompanyName ?? "");
      if (custom.length < 2) {
        ctx.addIssue({
          code: "custom",
          path: ["customCompanyName"],
          message: "Enter a custom company name (at least 2 characters)",
        });
      }
    } else if (
      data.companyId &&
      data.companyId !== NO_COMPANY_ID &&
      !getCompanyProfileById(data.companyId)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["companyId"],
        message: "Select a valid company",
      });
    }
  })
  .transform((data) => {
    let targetCompany: string | null = null;
    if (data.companyId === CUSTOM_COMPANY_ID) {
      targetCompany = sanitizeCompanyName(data.customCompanyName ?? "") || null;
    } else if (data.companyId && data.companyId !== NO_COMPANY_ID) {
      targetCompany = getCompanyProfileById(data.companyId)?.name ?? null;
    }

    return {
      interviewType: data.interviewType,
      roleTarget: data.roleTarget,
      experienceLevel: data.experienceLevel,
      difficulty: data.difficulty,
      durationPreset: data.durationPreset,
      customDurationMinutes: data.customDurationMinutes,
      resumeMode: data.resumeMode,
      targetCompany,
    };
  });

/** Wizard / action payload before schema transform. */
export type CreateInterviewFormInput = z.input<typeof createInterviewSchema>;
/** Normalized create payload after validation (includes targetCompany). */
export type CreateInterviewInput = z.output<typeof createInterviewSchema>;

export const JOB_ROLES = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "React Developer",
  "Node.js Developer",
  "Python Developer",
  "UI UX Designer",
  "QA Engineer",
  "DevOps Engineer",
  "Data Analyst",
] as const;

export function resolveDurationMinutes(input: CreateInterviewInput): number {
  if (input.durationPreset === "custom") {
    return input.customDurationMinutes ?? 20;
  }
  return Number(input.durationPreset);
}
