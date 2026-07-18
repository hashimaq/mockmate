"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";

import { captureException } from "@/lib/monitoring/logger";
import { toSafeClientError } from "@/lib/security/action-validation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, getSessionUser } from "@/services/auth";
import { notifyAdminEvent } from "@/services/notifications/admin-email-service";
import { ResumeProvider } from "@/services/resumes/resume-provider";
import type { ResumeAnalysisStatus } from "@/types/database";

export type ResumeActionResult = {
  success: boolean;
  error?: string;
  message?: string;
  status?: ResumeAnalysisStatus | "none";
  ready?: boolean;
  signedUrl?: string;
};

function scheduleResumeAnalysis(userId: string) {
  after(async () => {
    try {
      const supabase = await createClient();
      const provider = new ResumeProvider(supabase);
      await provider.service.processAnalysis(userId);
      revalidatePath("/dashboard/resume");
    } catch (error) {
      captureException(error, {
        source: "scheduleResumeAnalysis",
        userId,
      });
    }
  });
}

export async function uploadResumeAction(
  formData: FormData,
): Promise<ResumeActionResult> {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: "You must be signed in" };
  }

  const file = formData.get("resume");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "Please choose a PDF or DOCX resume." };
  }

  const supabase = await createClient();
  const provider = new ResumeProvider(supabase);

  try {
    await provider.service.uploadOrReplace(user.id, file);
    scheduleResumeAnalysis(user.id);

    // Kick analysis in this request too (same pattern as reports)
    const status = await provider.service.processAnalysis(user.id);
    const profile = await getCurrentProfile();

    void notifyAdminEvent({
      type: "resume_uploaded",
      userName: profile?.full_name,
      userEmail: profile?.email ?? user.email ?? "",
    });
    if (status.ready) {
      void notifyAdminEvent({
        type: "resume_analyzed",
        userName: profile?.full_name,
        userEmail: profile?.email ?? user.email ?? "",
      });
    }

    revalidatePath("/dashboard/resume");
    return {
      success: true,
      message:
        status.ready
          ? "Resume uploaded and analyzed."
          : "Resume uploaded. Analysis is running.",
      status: status.status,
      ready: status.ready,
    };
  } catch (error) {
    return {
      success: false,
      error: toSafeClientError(error, "Failed to upload resume"),
    };
  }
}

export async function deleteResumeAction(): Promise<ResumeActionResult> {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: "You must be signed in" };
  }

  const supabase = await createClient();
  const provider = new ResumeProvider(supabase);

  try {
    await provider.service.deleteForUser(user.id);
    revalidatePath("/dashboard/resume");
    return { success: true, message: "Resume deleted." };
  } catch (error) {
    return {
      success: false,
      error: toSafeClientError(error, "Failed to delete resume"),
    };
  }
}

export async function retryResumeAnalysisAction(): Promise<ResumeActionResult> {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: "You must be signed in" };
  }

  const supabase = await createClient();
  const provider = new ResumeProvider(supabase);

  try {
    await provider.service.markPendingForRetry(user.id);
    scheduleResumeAnalysis(user.id);
    const status = await provider.service.processAnalysis(user.id);

    revalidatePath("/dashboard/resume");
    return {
      success: true,
      message: status.ready
        ? "Resume analysis completed."
        : "Resume analysis restarted.",
      status: status.status,
      ready: status.ready,
      error: status.errorMessage ?? undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: toSafeClientError(error, "Failed to retry analysis"),
    };
  }
}

export async function getResumeStatusAction(): Promise<ResumeActionResult> {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: "You must be signed in" };
  }

  const supabase = await createClient();
  const provider = new ResumeProvider(supabase);

  try {
    const status = await provider.service.getStatus(user.id);

    if (
      status.status === "pending" ||
      (status.status === "processing" && !status.ready)
    ) {
      const processed = await provider.service.processAnalysis(user.id);
      return {
        success: true,
        status: processed.status,
        ready: processed.ready,
        error: processed.errorMessage ?? undefined,
      };
    }

    return {
      success: true,
      status: status.status,
      ready: status.ready,
      error: status.errorMessage ?? undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: toSafeClientError(error, "Failed to load resume status"),
    };
  }
}

export async function getResumeSignedUrlAction(): Promise<ResumeActionResult> {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: "You must be signed in" };
  }

  const supabase = await createClient();
  const provider = new ResumeProvider(supabase);

  try {
    const signedUrl = await provider.service.createSignedUrl(user.id);
    return { success: true, signedUrl };
  } catch (error) {
    return {
      success: false,
      error: toSafeClientError(error, "Failed to open resume"),
    };
  }
}
