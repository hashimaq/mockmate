import { Logo } from "@/components/layout/logo";
import { Separator } from "@/components/ui/separator";
import { FOOTER_LINKS } from "@/features/landing/data/content";
import { SITE_NAME } from "@/lib/constants";

const linkClassName =
  "text-sm text-muted-foreground transition-colors hover:text-foreground";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/70 bg-muted/30">
      <div className="container-wide section-padding py-14 sm:py-16">
        <div className="grid gap-10 md:grid-cols-[1.6fr_1fr]">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              AI-powered interview preparation for candidates who want sharper
              answers and real confidence.
            </p>
          </div>

          {FOOTER_LINKS.map((group) => (
            <div key={group.title}>
              <p className="text-sm font-semibold text-foreground">
                {group.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className={linkClassName}>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-10" />

        <div className="flex flex-col items-center justify-between gap-3 text-sm text-muted-foreground sm:flex-row">
          <p>
            © {year} {SITE_NAME}. All rights reserved.
          </p>
          <p>Built for candidates who practice like professionals.</p>
        </div>
      </div>
    </footer>
  );
}
