import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Service-role client that BYPASSES Row Level Security.
 *
 * Server-only. Never import this from a Client Component and never expose
 * SUPABASE_SERVICE_ROLE_KEY to the browser. Used for cross-tenant lookups
 * that must happen before we know which org is making the request, e.g.
 * resolving an org from a hashed API key or an inbound webhook token.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
