import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;

const BUCKET = "resumes";

export class StorageService {
  constructor(private readonly supabase: Client) {}

  buildPath(userId: string, fileName: string): string {
    const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
    return `${userId}/${Date.now()}-${safe}`;
  }

  async uploadResume(input: {
    userId: string;
    fileName: string;
    mimeType: string;
    bytes: ArrayBuffer;
  }): Promise<string> {
    const path = this.buildPath(input.userId, input.fileName);
    const { error } = await this.supabase.storage
      .from(BUCKET)
      .upload(path, input.bytes, {
        contentType: input.mimeType,
        upsert: false,
      });

    if (error) {
      throw new Error(error.message);
    }

    return path;
  }

  async download(path: string): Promise<Blob> {
    const { data, error } = await this.supabase.storage
      .from(BUCKET)
      .download(path);

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to download resume");
    }

    return data;
  }

  async createSignedUrl(path: string, expiresInSeconds = 60 * 10) {
    const { data, error } = await this.supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, expiresInSeconds);

    if (error || !data?.signedUrl) {
      throw new Error(error?.message ?? "Failed to create signed URL");
    }

    return data.signedUrl;
  }

  async remove(path: string): Promise<void> {
    const { error } = await this.supabase.storage.from(BUCKET).remove([path]);
    if (error) {
      throw new Error(error.message);
    }
  }
}
