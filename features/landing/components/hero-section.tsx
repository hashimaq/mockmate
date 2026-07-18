import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";

import { FadeIn } from "@/components/motion/fade-in";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SITE_NAME } from "@/lib/constants";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_-15%,var(--hero-glow),transparent_70%)]" />
        <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -right-16 top-40 h-64 w-64 rounded-full bg-chart-2/20 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,oklch(0.45_0.04_155/0.05)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.45_0.04_155/0.05)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_65%_55%_at_50%_0%,#000_35%,transparent_100%)] dark:bg-[linear-gradient(to_right,oklch(0.8_0.08_155/0.06)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.8_0.08_155/0.06)_1px,transparent_1px)]" />
      </div>

      <div className="container-wide section-padding">
        <div className="mx-auto max-w-3xl text-center">
          <FadeIn y={16}>
            <Badge className="mb-6">AI Interview Coach</Badge>
          </FadeIn>

          <FadeIn delay={0.05}>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-[4.25rem] lg:leading-[1.08]">
              <span className="block bg-gradient-to-r from-primary via-[oklch(0.5_0.14_145)] to-[oklch(0.55_0.12_110)] bg-clip-text text-transparent dark:from-primary dark:via-[oklch(0.82_0.14_145)] dark:to-[oklch(0.78_0.12_110)]">
                {SITE_NAME}
              </span>
              <span className="mt-2 block">
                Ace every interview with AI-powered practice
              </span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.12}>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Practice realistic mock interviews, get instant feedback, and track
              your progress — so you walk into every room prepared.
            </p>
          </FadeIn>

          <FadeIn delay={0.18} className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/register">
                Start Practicing
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button size="lg" variant="outline" disabled className="gap-2">
              <Play className="h-4 w-4" aria-hidden />
              Watch Demo
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Soon
              </span>
            </Button>
          </FadeIn>
        </div>

        <FadeIn delay={0.25} y={40} duration={0.7} className="relative mx-auto mt-16 max-w-5xl sm:mt-20">
          <div
            className="absolute -inset-4 rounded-[2rem] bg-gradient-to-b from-primary/15 via-primary/5 to-transparent blur-2xl"
            aria-hidden
          />
          <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-surface-elevated shadow-2xl shadow-foreground/10">
            <div className="flex items-center gap-2 border-b border-border/70 bg-muted/40 px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" aria-hidden />
              <span className="h-2.5 w-2.5 rounded-full bg-chart-4/80" aria-hidden />
              <span className="h-2.5 w-2.5 rounded-full bg-chart-2/80" aria-hidden />
              <span className="ml-3 text-xs font-medium text-muted-foreground">
                {SITE_NAME} Session Preview
              </span>
            </div>
            <div className="grid gap-0 md:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4 p-6 sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Live interview
                </p>
                <p className="text-lg font-semibold text-foreground sm:text-xl">
                  “Tell me about a time you resolved a production incident under
                  pressure.”
                </p>
                <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Your answer appears here as you speak. {SITE_NAME} listens,
                    structures your response, and prepares coaching notes in
                    real time.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {["Clarity", "Structure", "Impact"].map((tag) => (
                    <span
                      key={tag}
                      className="rounded-lg border border-border/70 bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="border-t border-border/70 bg-gradient-to-br from-primary/8 via-background to-accent/40 p-6 sm:border-l sm:border-t-0 sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  AI feedback
                </p>
                <ul className="mt-4 space-y-3">
                  {[
                    "Strong opening with context and ownership",
                    "Add metrics to quantify the outcome",
                    "Tighten the closing into a clear takeaway",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex gap-3 rounded-xl border border-border/60 bg-background/70 p-3 text-sm text-foreground backdrop-blur-sm"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
