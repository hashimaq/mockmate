import { ArrowDown } from "lucide-react";

import { SectionHeading } from "@/components/layout/section-heading";
import { Reveal } from "@/components/motion/reveal";
import { HOW_IT_WORKS } from "@/features/landing/data/content";

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="relative section-padding scroll-mt-20 py-20 sm:py-28"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-muted/40 via-transparent to-muted/40"
      />

      <div className="container-narrow">
        <SectionHeading
          eyebrow="How It Works"
          title="From signup to sharper answers in four steps"
          description="A simple loop designed for consistent improvement — not endless content consumption."
        />

        <ol className="relative mx-auto mt-16 max-w-xl space-y-0">
          {HOW_IT_WORKS.map((item, index) => {
            const isLast = index === HOW_IT_WORKS.length - 1;
            return (
              <li key={item.id} className="relative">
                <Reveal
                  delay={index * 0.08}
                  x={-16}
                  y={0}
                  className="relative rounded-2xl border border-border/70 bg-card/90 p-6 shadow-sm shadow-foreground/5 backdrop-blur-sm sm:p-7"
                >
                  <div className="flex items-start gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[oklch(0.42_0.12_130)] text-sm font-bold text-primary-foreground shadow-md shadow-primary/30 dark:to-[oklch(0.65_0.14_130)]">
                      {item.step}
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {item.title}
                      </h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </Reveal>

                {!isLast ? (
                  <div
                    className="flex justify-center py-3 text-primary/70"
                    aria-hidden
                  >
                    <ArrowDown className="h-5 w-5 motion-safe:animate-bounce" />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
