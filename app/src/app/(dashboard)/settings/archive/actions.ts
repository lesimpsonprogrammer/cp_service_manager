"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/getCurrentOrg";

const ADMIN_ROLES = new Set(["owner", "admin"]);
const DEFAULT_RETENTION_YEARS = 7;

export interface ArchiveActionState {
  error: string | null;
  archivedCount?: number;
}

export async function getRetentionYears(category: string): Promise<number> {
  const org = await getCurrentOrg();
  if (!org) return DEFAULT_RETENTION_YEARS;

  const supabase = await createClient();
  const { data } = await supabase
    .from("retention_policies")
    .select("retention_years")
    .eq("org_id", org.orgId)
    .eq("category", category)
    .maybeSingle();

  return data?.retention_years ?? DEFAULT_RETENTION_YEARS;
}

export async function setRetentionPolicy(
  category: string,
  _prev: ArchiveActionState,
  formData: FormData
): Promise<ArchiveActionState> {
  const org = await getCurrentOrg();
  if (!org) return { error: "Not signed in." };
  if (!ADMIN_ROLES.has(org.role)) return { error: "Only owners and admins can change retention policy." };

  const years = Number(formData.get("years"));
  if (!Number.isInteger(years) || years < 1 || years > 50) {
    return { error: "Enter a whole number of years between 1 and 50." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("retention_policies").upsert({
    org_id: org.orgId,
    category,
    retention_years: years,
    updated_at: new Date().toISOString(),
    updated_by: org.userId,
  });

  if (error) return { error: error.message };

  revalidatePath("/settings/archive");
  return { error: null };
}

/**
 * Moves org_members rows that have been removed/suspended longer than the
 * category's retention window into archived_records as a JSON snapshot,
 * then deletes them from the live table. Archived data stays fully
 * retrievable -- restoreFromArchive puts a row back into the recycle bin.
 */
export async function runOrgMembersArchiveBatch(): Promise<ArchiveActionState> {
  const org = await getCurrentOrg();
  if (!org) return { error: "Not signed in." };
  if (!ADMIN_ROLES.has(org.role)) return { error: "Only owners and admins can run an archive batch." };

  const category = "org_members";
  const years = await getRetentionYears(category);
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - years);

  const supabase = await createClient();
  const { data: eligible, error: fetchError } = await supabase
    .from("org_members")
    .select("*")
    .eq("org_id", org.orgId)
    .neq("status", "active")
    .not("status_changed_at", "is", null)
    .lt("status_changed_at", cutoff.toISOString());

  if (fetchError) return { error: fetchError.message };
  if (!eligible || eligible.length === 0) return { error: null, archivedCount: 0 };

  const batchLabel = `archive-${new Date().toISOString().slice(0, 10)}`;

  const { error: insertError } = await supabase.from("archived_records").insert(
    eligible.map((row) => ({
      org_id: org.orgId,
      category,
      source_id: row.user_id,
      data: row,
      removed_at: row.status_changed_at,
      archived_by: org.userId,
      batch_label: batchLabel,
    }))
  );

  if (insertError) return { error: insertError.message };

  const { error: deleteError } = await supabase
    .from("org_members")
    .delete()
    .eq("org_id", org.orgId)
    .in(
      "user_id",
      eligible.map((row) => row.user_id)
    );

  if (deleteError) return { error: deleteError.message };

  revalidatePath("/settings/archive");
  revalidatePath("/settings/team");
  return { error: null, archivedCount: eligible.length };
}

export async function restoreFromArchive(archiveId: string): Promise<ArchiveActionState> {
  const org = await getCurrentOrg();
  if (!org) return { error: "Not signed in." };
  if (!ADMIN_ROLES.has(org.role)) return { error: "Only owners and admins can restore archived records." };

  const supabase = await createClient();
  const { data: record } = await supabase
    .from("archived_records")
    .select("id, org_id, category, data")
    .eq("id", archiveId)
    .eq("org_id", org.orgId)
    .maybeSingle();

  if (!record) return { error: "Archived record not found." };

  if (record.category === "org_members") {
    const row = record.data as {
      org_id: string;
      user_id: string;
      role: string;
      status_changed_at: string | null;
      status_changed_by: string | null;
      created_at: string;
    };
    const { error: insertError } = await supabase.from("org_members").insert({
      org_id: row.org_id,
      user_id: row.user_id,
      role: row.role as "owner" | "admin" | "member" | "viewer" | "sys_admin",
      status: "removed",
      status_changed_at: row.status_changed_at,
      status_changed_by: row.status_changed_by,
      created_at: row.created_at,
    });
    if (insertError) return { error: insertError.message };
  } else {
    return { error: `Restoring "${record.category}" records isn't supported yet.` };
  }

  const { error: deleteError } = await supabase.from("archived_records").delete().eq("id", archiveId);
  if (deleteError) return { error: deleteError.message };

  revalidatePath("/settings/archive");
  revalidatePath("/settings/team");
  return { error: null };
}
