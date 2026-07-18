import {
  Briefcase,
  Clock,
  MessageSquare,
  Shield,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import { SectionHeading } from "@/components/layout/section-heading";
import { Reveal } from "@/components/motion/reveal";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FEATURES } from "@/features/landing/data/content";
import type { FeatureIconName } from "@/types";

const ICON_MAP: Record<FeatureIconName, LucideIcon> = {
  MessageSquare,
  Sparkles,
  TrendingUp,
  Briefcase,
  Clock,
  Shield,
};

export function FeaturesSection() {
  return (
    <section id="features" className="section-padding scroll-mt-20 py-20 sm:py-28">
      <div className="container-wide">
        <SectionHeading
          eyebrow="Features"
          title="Everything you need to interview with confidence"
          description="From realistic practice to actionable feedback — MockMate turns preparation into a measurable advantage."
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => {
            const Icon = ICON_MAP[feature.icon];
            return (
              <Reveal key={feature.id} delay={index * 0.06}>
                <Card className="h-full border-border/70 bg-card/90 transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-lg hover:shadow-primary/10">
                  <CardHeader>
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-chart-2/20 text-primary ring-1 ring-primary/15">
                      <Icon className="h-5 w-5" aria-hidden />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-[0.9375rem]">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
