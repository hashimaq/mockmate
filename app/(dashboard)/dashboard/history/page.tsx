import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeader } from "@/features/dashboard/components/page-header";
import { HistoryList } from "@/features/interviews/components/history-list";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/services/auth";
import { InterviewService } from "@/services/interviews/interview-service";

export const metadata: Metadata = {
  title: "History",
};

export default async function HistoryPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?next=/dashboard/history");
  }

  const supabase = await createClient();
  const interviews = await new InterviewService(supabase).listForUser(user.id);

  return (
    <div>
      <PageHeader
        title="History"
        description="Browse every practice session you've completed."
      />
      <HistoryList interviews={interviews} />
    </div>
  );
}
