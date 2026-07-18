import { notFound, redirect } from "next/navigation";

import { ReportDetail } from "@/features/reports/components/report-detail";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/services/auth";
import { InterviewService } from "@/services/interviews/interview-service";
import { ReportService } from "@/services/reports/report-service";

type ReportPageProps = {
  params: Promise<{ interviewId: string }>;
};

export default async function ReportPage({ params }: ReportPageProps) {
  const { interviewId } = await params;
  const user = await getSessionUser();
  if (!user) {
    redirect(`/login?next=/dashboard/reports/${interviewId}`);
  }

  const supabase = await createClient();
  const interviews = new InterviewService(supabase);
  const reports = new ReportService(supabase);

  const interview = await interviews.getById(interviewId, user.id);
  if (!interview) {
    notFound();
  }

  const report = await reports.getByInterviewId(interviewId, user.id);

  return <ReportDetail interview={interview} report={report} />;
}
