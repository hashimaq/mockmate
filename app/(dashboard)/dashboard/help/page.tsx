import type { Metadata } from "next";
import { HelpCircle, Mail, MessageCircle } from "lucide-react";

import { DashboardCard } from "@/features/dashboard/components/dashboard-card";
import { PageHeader } from "@/features/dashboard/components/page-header";

export const metadata: Metadata = {
  title: "Help",
};

const HELP_ITEMS = [
  {
    icon: HelpCircle,
    title: "Getting started",
    body: "Create an account, open Interviews, and complete short practice sessions regularly.",
  },
  {
    icon: MessageCircle,
    title: "Feedback quality",
    body: "Detailed AI coaching reports unlock after you finish a full mock interview session.",
  },
  {
    icon: Mail,
    title: "Need support?",
    body: "Reach out from your account email. Support channels will expand as MockMate launches.",
  },
] as const;

export default function HelpPage() {
  return (
    <div>
      <PageHeader
        title="Help"
        description="Quick answers while you explore the MockMate dashboard."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {HELP_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <DashboardCard key={item.title}>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <h2 className="font-semibold text-foreground">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </DashboardCard>
          );
        })}
      </div>
    </div>
  );
}
