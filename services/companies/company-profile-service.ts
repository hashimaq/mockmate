import "server-only";

import {
  buildCustomCompanyProfile,
  getCompanyProfileById,
  getCompanyProfileByName,
  type CompanyProfile,
} from "@/services/companies/company-profiles";
import { sanitizeCompanyName } from "@/services/companies/company-utils";

export { sanitizeCompanyName };

export function resolveCompanyProfile(
  targetCompany: string | null | undefined,
): CompanyProfile | null {
  if (!targetCompany?.trim()) return null;
  const known =
    getCompanyProfileByName(targetCompany) ??
    getCompanyProfileById(targetCompany.toLowerCase());
  if (known) return known;
  return buildCustomCompanyProfile(sanitizeCompanyName(targetCompany));
}

export class CompanyProfileService {
  static resolve(targetCompany: string | null | undefined): CompanyProfile | null {
    return resolveCompanyProfile(targetCompany);
  }

  static formatForPrompt(profile: CompanyProfile): string {
    return [
      `Company: ${profile.name}`,
      `Hiring philosophy: ${profile.hiringPhilosophy}`,
      `Preferred interview style: ${profile.preferredInterviewStyle}`,
      `Behavioral focus: ${profile.behavioralFocus.join(", ")}`,
      `Technical emphasis: ${profile.technicalEmphasis.join(", ")}`,
      `Leadership expectations: ${profile.leadershipExpectations.join(", ")}`,
    ].join("\n");
  }
}
