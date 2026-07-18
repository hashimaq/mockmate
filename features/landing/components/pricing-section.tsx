import { Bell } from "lucide-react";

import { SectionHeading } from "@/components/layout/section-heading";
import { Reveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function PricingSection() {
  return (
    <section id="pricing" className="section-padding scroll-mt-20 py-20 sm:py-28">
      <div className="container-narrow">
        <SectionHeading
          eyebrow="Pricing"
          title="Simple plans that grow with you"
          description="We're finalizing launch pricing. Join the waitlist to get early access and founding member benefits."
        />

        <Reveal className="relative mx-auto mt-14 max-w-lg overflow-hidden rounded-3xl border border-border/70 bg-card p-8 text-center shadow-lg shadow-foreground/5 sm:p-10">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--hero-glow),transparent_60%)]"
          />
          <div className="relative">
            <Badge variant="secondary" className="mb-4">
              Coming Soon
            </Badge>
            <h3 className="text-2xl font-bold tracking-tight text-foreground">
              Pricing plans launch soon
            </h3>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Free practice, pro coaching, and team options are on the way. Be
              first to know when MockMate opens enrollment.
            </p>
            <Button className="mt-8" size="lg" disabled type="button">
              <Bell className="h-4 w-4" aria-hidden />
              Notify Me
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
