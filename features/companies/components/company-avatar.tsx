import {
  buildCustomCompanyProfile,
  getCompanyProfileByName,
  type CompanyProfile,
} from "@/services/companies/company-profiles";
import { cn } from "@/lib/utils";

type CompanyAvatarProps = {
  companyName: string;
  className?: string;
  size?: "sm" | "md";
};

function resolveProfile(companyName: string): CompanyProfile {
  return (
    getCompanyProfileByName(companyName) ??
    buildCustomCompanyProfile(companyName)
  );
}

export function CompanyAvatar({
  companyName,
  className,
  size = "md",
}: CompanyAvatarProps) {
  const profile = resolveProfile(companyName);
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-gradient-to-br from-primary/15 via-background to-emerald-500/10 font-semibold text-primary",
        size === "sm" ? "h-8 w-8 text-[10px]" : "h-10 w-10 text-xs",
        className,
      )}
      aria-hidden
      title={profile.name}
    >
      {profile.initials}
    </span>
  );
}
