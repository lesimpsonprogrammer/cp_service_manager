import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";
import { ATTACHMENTS_BUCKET } from "./constants";
import { safeFileName, validateAttachments } from "./validation";

type Db = SupabaseClient<Database>;

/** Pulls the File entries for `field` out of a form submission. */
export function filesFromForm(formData: FormData, field = "attachments"): File[] {
  return formData.getAll(field).filter((v): v is File => typeof v === "object" && v !== null && "arrayBuffer" in v);
}

/** Validation only — call before writing the message so a bad file doesn't leave a half-posted reply. */
export function checkAttachments(files: File[]): { ok: true; files: File[] } | { ok: false; error: string } {
  const result = validateAttachments(files.map((f) => ({ name: f.name, size: f.size, type: f.type })));
  if (!result.ok) return result;
  return { ok: true, files: files.filter((f) => f.name && f.size > 0) };
}

/**
 * Uploads already-validated files to the private bucket (service role) and
 * records them through `db`, so staff uploads go through RLS as the signed-in
 * user and portal uploads go through the service role after the caller has
 * checked membership. If a row insert fails, the orphaned object is removed.
 */
export async function storeAttachments(
  db: Db,
  files: File[],
  ctx: { orgId: string; ticketId: string; messageId: string | null; uploadedBy: string | null }
): Promise<{ stored: number; error: string | null }> {
  if (files.length === 0) return { stored: 0, error: null };
  const storage = createAdminClient().storage.from(ATTACHMENTS_BUCKET);
  let stored = 0;

  for (const file of files) {
    const fileName = safeFileName(file.name);
    const path = `${ctx.orgId}/${ctx.ticketId}/${randomUUID()}-${fileName}`;
    const bytes = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await storage.upload(path, bytes, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
    if (uploadError) return { stored, error: `Couldn't upload "${fileName}": ${uploadError.message}` };

    const { error: rowError } = await db.from("ticket_attachments").insert({
      ticket_id: ctx.ticketId,
      message_id: ctx.messageId,
      org_id: ctx.orgId,
      storage_path: path,
      file_name: fileName,
      content_type: file.type || null,
      size_bytes: file.size,
      uploaded_by: ctx.uploadedBy,
    });
    if (rowError) {
      await storage.remove([path]);
      return { stored, error: `Couldn't save "${fileName}": ${rowError.message}` };
    }
    stored += 1;
  }

  return { stored, error: null };
}

export async function createAttachmentDownloadUrl(storagePath: string, fileName: string): Promise<string | null> {
  const { data, error } = await createAdminClient()
    .storage.from(ATTACHMENTS_BUCKET)
    .createSignedUrl(storagePath, 60, { download: fileName });
  if (error || !data) return null;
  return data.signedUrl;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
