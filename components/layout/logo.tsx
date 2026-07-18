import Link from "next/link";
import { Mic2 } from "lucide-react";

import { SITE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  showText?: boolean;
};

function BrandMark() {
  const mateIndex = SITE_NAME.indexOf("Mate");
  if (mateIndex <= 0) {
    return <>{SITE_NAME}</>;
  }

  return (
    <>
      {SITE_NAME.slice(0, mateIndex)}
      <span className="text-primary">{SITE_NAME.slice(mateIndex)}</span>
    </>
  );
}

export function Logo({ className, showText = true }: LogoProps) {
  return (
    <Link
      href="/"
      className={cn(
        "group inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      aria-label={`${SITE_NAME} home`}
    >
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary to-[oklch(0.55_0.12_130)] text-primary-foreground shadow-md shadow-primary/30 transition-transform duration-300 group-hover:scale-[1.04] dark:to-[oklch(0.7_0.14_130)]">
        <Mic2 className="h-4 w-4" aria-hidden />
      </span>
      {showText ? (
        <span className="text-xl font-bold tracking-tight text-foreground">
          <BrandMark />
        </span>
      ) : null}
    </Link>
  );
}
