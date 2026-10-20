import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Db = SupabaseClient<Database>;

/** Display names for a set of user ids (staff via profiles). Unknown ids are omitted. */
export async function getDisplayNames(db: Db, userIds: (string | null | undefined)[]): Promise<Map<string, string>> {
  const ids = Array.from(new Set(userIds.filter((id): id is string => !!id)));
  if (ids.length === 0) return new Map();
  const { data } = await db.from("profiles").select("id, full_name").in("id", ids);
  return new Map((data ?? []).map((p) => [p.id, p.full_name?.trim() || "Unnamed teammate"]));
}

/**
 * Auth emails for a handful of users. Needs the service-role client
 * (auth.users isn't readable through RLS). Failures are skipped so a deleted
 * account never blocks a notification to everyone else.
 */
export async function getUserEmails(admin: Db, userIds: (string | null | undefined)[]): Promise<Map<string, string>> {
  const ids = Array.from(new Set(userIds.filter((id): id is string => !!id)));
  const entries = await Promise.all(
    ids.map(async (id) => {
      try {
        const { data } = await admin.auth.admin.getUserById(id);
        return data.user?.email ? ([id, data.user.email] as const) : null;
      } catch {
        return null;
      }
    })
  );
  return new Map(entries.filter((e): e is readonly [string, string] => e !== null));
}
