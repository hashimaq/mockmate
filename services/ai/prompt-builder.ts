import "server-only";

import { CompanyProfileService } from "@/services/companies/company-profile-service";
import { ResumeAnalysisService } from "@/services/resumes/resume-analysis-service";
import type { ResumeContextSummary } from "@/services/resumes/schemas";
import type { QuestionQuery } from "@/services/questions/types";
import type {
  Answer,
  ExperienceLevel,
  Interview,
  InterviewDifficulty,
  InterviewType,
  Question,
} from "@/types/database";

function labelExperience(level: ExperienceLevel): string {
  const map: Record<ExperienceLevel, string> = {
    intern: "Intern",
    junior: "Junior",
    mid: "Mid-Level",
    senior: "Senior",
  };
  return map[level];
}

function labelType(type: InterviewType): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function labelDifficulty(level: InterviewDifficulty): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

export class PromptBuilder {
  /** Fewer questions = faster generation + shorter interviews. */
  static questionCountForDuration(minutes: number): number {
    if (minutes <= 10) return 3;
    if (minutes <= 20) return 4;
    if (minutes <= 30) return 5;
    return Math.min(6, Math.max(4, Math.round(minutes / 6)));
  }

  static buildQuestionPrompt(query: QuestionQuery): {
    system: string;
    user: string;
  } {
    const count =
      query.limit ??
      this.questionCountForDuration(query.durationMinutes ?? 20);

    const system =
      "You write concise mock-interview questions. Return JSON only. No markdown.";

    const resumeMode = Boolean(query.resumeMode && query.resumeContext);
    const resumeBlock = resumeMode
      ? [
          "",
          "RESUME MODE: Use BOTH the interview settings above AND this resume analysis.",
          "Never ignore the selected role, experience, type, or difficulty.",
          "Candidate resume analysis:",
          ResumeAnalysisService.formatContextForPrompt(query.resumeContext!),
          "",
          "Personalization rules:",
          "- Sound like a real interviewer who reviewed this resume.",
          "- Reference the candidate's projects, technologies, frameworks, libraries, databases, cloud platforms, work experience, certifications, or achievements when appropriate.",
          "- Example styles: \"I noticed you worked with Docker…\", \"Tell me about the authentication system you built.\", \"Explain one challenge from your MERN project.\"",
          "- Ask behavioral follow-ups tied to previous roles when interview type is hr/behavioral/mixed.",
          "- Do not invent employers, projects, or skills not present in the resume context.",
        ].join("\n")
      : "";

    const companyProfile = CompanyProfileService.resolve(query.targetCompany);
    const companyBlock = companyProfile
      ? [
          "",
          "COMPANY MODE: Adapt interview style to this company's hiring profile.",
          "Still honor role, experience, type, and difficulty settings.",
          CompanyProfileService.formatForPrompt(companyProfile),
          "",
          "Adaptation rules:",
          "- Match interview style, behavioral expectations, technical focus, and follow-up depth.",
          "- Do not hardcode canned questions; generate dynamically for this company + settings.",
          "- Prefer follow-ups that probe the company's emphasized themes.",
        ].join("\n")
      : "";

    const user = [
      `Generate exactly ${count} short interview questions.`,
      `Role: ${query.roleTarget}`,
      `Level: ${labelExperience(query.experienceLevel)}`,
      `Type: ${labelType(query.interviewType)}`,
      `Difficulty: ${labelDifficulty(query.difficulty)}`,
      `Duration: ${query.durationMinutes ?? 20} minutes`,
      companyBlock,
      resumeBlock,
      'JSON: { "questions": [ { "prompt": string, "category": string | null } ] }',
      "Keep each prompt under 40 words. Match role and level.",
    ]
      .filter(Boolean)
      .join("\n");

    return { system, user };
  }

  static buildEvaluationPrompt(input: {
    interview: Interview;
    questions: Question[];
    answers: Answer[];
    resumeContext?: ResumeContextSummary | null;
  }): { system: string; user: string } {
    const { interview, questions, answers, resumeContext } = input;
    const answerByQuestion = new Map(
      answers.map((answer) => [answer.question_id, answer]),
    );

    const transcript = questions
      .map((question, index) => {
        const answer = answerByQuestion.get(question.id);
        const content = answer?.content?.trim() || "(No answer provided)";
        return [
          `Q${index + 1} [id=${question.id}]`,
          `Question: ${question.prompt}`,
          `Candidate answer: ${content}`,
        ].join("\n");
      })
      .join("\n\n");

    const system = [
      "You are MockMate, a rigorous but constructive interview evaluator.",
      "Score honestly. Prefer specific, actionable feedback over generic praise.",
      "Always include clear strengths, weaknesses, a personalized improvement plan,",
      "and stronger sample answers for every question.",
      "Return strict JSON only. No markdown. No commentary.",
    ].join(" ");

    const companyProfile = CompanyProfileService.resolve(
      interview.target_company,
    );

    const resumeSection = resumeContext
      ? [
          "",
          "Candidate resume context (compare answers against these claims):",
          ResumeAnalysisService.formatContextForPrompt(resumeContext),
          "",
          "Also include resumeInsights in the JSON (Resume Alignment):",
          "{",
          '  "strongAlignment": string[],',
          '  "knowledgeGaps": string[],',
          '  "resumeClaimsNeedingImprovement": string[],',
          '  "missingExplanations": string[],',
          '  "personalizedRecommendations": string[],',
          '  "skillsDemonstratedSuccessfully": string[],',
          '  "topicsAnsweredWeakly": string[],',
          '  "skillsRequiringImprovement": string[],',
          '  "resumeCredibilityScore": number 0-100,',
          '  "suggestedLearningPath": string[]',
          "}",
          "Resume Alignment rules:",
          "- strongAlignment: how well answers matched resume claims.",
          "- skillsDemonstratedSuccessfully: skills proven clearly in answers.",
          "- topicsAnsweredWeakly / knowledgeGaps: resume topics answered weakly.",
          "- skillsRequiringImprovement: skills that need practice.",
          "- resumeClaimsNeedingImprovement: claims that need clearer storytelling.",
          "- missingExplanations: important resume items never explained.",
          "- resumeCredibilityScore: 0-100 credibility of resume vs answers.",
          "- suggestedLearningPath / personalizedRecommendations: concrete next steps.",
        ].join("\n")
      : "";

    const companySection = companyProfile
      ? [
          "",
          "Target company hiring profile:",
          CompanyProfileService.formatForPrompt(companyProfile),
          "",
          "Also include companyInsights in the JSON:",
          "{",
          '  "companyReadinessScore": number 0-100,',
          '  "hiringStyleMatch": string[],',
          '  "behavioralReadiness": number 0-100,',
          '  "technicalReadiness": number 0-100,',
          '  "recommendedImprovements": string[],',
          '  "suggestedNextInterview": string',
          "}",
          "Company insight rules:",
          "- Score readiness for THIS company's hiring style.",
          "- hiringStyleMatch: where answers aligned with company expectations.",
          "- recommendedImprovements: company-specific next practice steps.",
          "- suggestedNextInterview: one concrete next mock interview to run.",
        ].join("\n")
      : "";

    const user = [
      "Evaluate this completed mock interview.",
      `Role: ${interview.role_target ?? "General"}`,
      `Experience: ${interview.experience_level ? labelExperience(interview.experience_level) : "Unspecified"}`,
      `Interview type: ${labelType(interview.interview_type)}`,
      `Difficulty: ${labelDifficulty(interview.difficulty)}`,
      interview.target_company
        ? `Target company: ${interview.target_company}`
        : null,
      "",
      "Transcript:",
      transcript,
      resumeSection,
      companySection,
      "",
      "Return JSON with this exact shape:",
      "{",
      '  "overallScore": number 0-100,',
      '  "technicalScore": number 0-100,',
      '  "communicationScore": number 0-100,',
      '  "problemSolvingScore": number 0-100,',
      '  "strengths": string[],',
      '  "weaknesses": string[],',
      '  "improvementPlan": string[],',
      '  "summary": string,',
      '  "questionFeedback": [',
      '    { "questionIndex": number, "score": number, "feedback": string, "betterAnswer": string }',
      "  ]",
      resumeContext ? '  ,"resumeInsights": { ... }' : null,
      companyProfile ? '  ,"companyInsights": { ... }' : null,
      "}",
      "",
      "Rules:",
      `- questionFeedback must include exactly one entry per question (${questions.length} total).`,
      "- questionIndex is 0-based and must match transcript order.",
      "- strengths: 3-5 specific things the candidate did well.",
      "- weaknesses: 3-5 concrete gaps or risks (not vague).",
      "- improvementPlan: 3-5 personalized next steps the candidate should practice.",
      "- betterAnswer should be a stronger sample response, not just tips.",
      "- feedback should explain what was missing and how to improve.",
      "- summary should be 3-5 sentences covering overall performance.",
      "- For HR/behavioral interviews, interpret technicalScore as role/domain knowledge depth.",
      resumeContext
        ? "- When resume context is provided, resumeInsights is required."
        : "- Do not invent resumeInsights when no resume context is provided.",
      companyProfile
        ? "- When a target company is provided, companyInsights is required."
        : "- Do not invent companyInsights when no target company is provided.",
    ]
      .filter((line): line is string => line !== null)
      .join("\n");

    return { system, user };
  }
}
