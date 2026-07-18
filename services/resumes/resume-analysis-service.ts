import "server-only";

import { getAIService } from "@/services/ai/ai-service";
import {
  geminiResumeAnalysisSchema,
  type GeminiResumeAnalysis,
  type ResumeContextSummary,
} from "@/services/resumes/schemas";
import type { ResumeAnalysis } from "@/types/database";

export class ResumeAnalysisService {
  async analyzeText(input: {
    userId: string;
    extractedText: string;
  }): Promise<GeminiResumeAnalysis> {
    const clipped = input.extractedText.slice(0, 18000);
    const ai = getAIService();

    return ai.generateJson({
      system: [
        "You are MockMate Resume Intelligence.",
        "Extract structured resume data for interview personalization.",
        "Return strict JSON only. No markdown.",
      ].join(" "),
      user: [
        "Analyze this resume text and return structured JSON.",
        "",
        "Resume text:",
        clipped,
        "",
        "JSON shape:",
        "{",
        '  "personalSummary": string,',
        '  "skills": string[],',
        '  "programmingLanguages": string[],',
        '  "frameworks": string[],',
        '  "libraries": string[],',
        '  "databases": string[],',
        '  "cloudPlatforms": string[],',
        '  "tools": string[],',
        '  "projects": [{ "name": string, "description": string, "technologies": string[] }],',
        '  "workExperience": [{ "company": string, "title": string, "duration": string, "highlights": string[] }],',
        '  "education": [{ "school": string, "degree": string, "year": string }],',
        '  "certifications": string[],',
        '  "softSkills": string[],',
        '  "yearsOfExperience": number,',
        '  "careerLevel": string,',
        '  "healthScore": number 0-100,',
        '  "suggestions": string[]',
        "}",
        "",
        "Rules:",
        "- Prefer concrete technologies and project names from the resume.",
        "- healthScore rates clarity, impact, and completeness.",
        "- suggestions: 3-6 actionable resume improvements.",
        "- If a field is unknown, use an empty array or a short best-effort value.",
      ].join("\n"),
      schema: geminiResumeAnalysisSchema,
      rateLimitKey: `resume:${input.userId}`,
      temperature: 0.25,
      maxOutputTokens: 4096,
    });
  }

  static toContextSummary(analysis: ResumeAnalysis): ResumeContextSummary {
    return {
      personalSummary: analysis.personal_summary,
      skills: analysis.skills,
      programmingLanguages: analysis.programming_languages,
      frameworks: analysis.frameworks,
      libraries: analysis.libraries,
      databases: analysis.databases,
      cloudPlatforms: analysis.cloud_platforms,
      tools: analysis.tools,
      projects: analysis.projects as ResumeContextSummary["projects"],
      workExperience:
        analysis.work_experience as ResumeContextSummary["workExperience"],
      yearsOfExperience:
        analysis.years_of_experience === null
          ? null
          : Number(analysis.years_of_experience),
      careerLevel: analysis.career_level,
    };
  }

  static formatContextForPrompt(context: ResumeContextSummary): string {
    const projectLines = context.projects
      .slice(0, 5)
      .map((project) => {
        const tech = (project.technologies ?? []).slice(0, 6).join(", ");
        return `- ${project.name}${tech ? ` (${tech})` : ""}${
          project.description ? `: ${project.description.slice(0, 160)}` : ""
        }`;
      })
      .join("\n");

    const experienceLines = context.workExperience
      .slice(0, 4)
      .map(
        (job) =>
          `- ${job.title} @ ${job.company}${job.duration ? ` (${job.duration})` : ""}`,
      )
      .join("\n");

    return [
      context.personalSummary
        ? `Summary: ${context.personalSummary}`
        : null,
      context.careerLevel
        ? `Career level: ${context.careerLevel}`
        : null,
      context.yearsOfExperience !== null
        ? `Years of experience: ${context.yearsOfExperience}`
        : null,
      `Skills: ${context.skills.slice(0, 20).join(", ") || "n/a"}`,
      `Languages: ${context.programmingLanguages.slice(0, 15).join(", ") || "n/a"}`,
      `Frameworks: ${context.frameworks.slice(0, 15).join(", ") || "n/a"}`,
      `Databases: ${context.databases.slice(0, 12).join(", ") || "n/a"}`,
      `Cloud: ${context.cloudPlatforms.slice(0, 10).join(", ") || "n/a"}`,
      `Tools: ${context.tools.slice(0, 15).join(", ") || "n/a"}`,
      projectLines ? `Projects:\n${projectLines}` : null,
      experienceLines ? `Experience:\n${experienceLines}` : null,
    ]
      .filter(Boolean)
      .join("\n");
  }
}
