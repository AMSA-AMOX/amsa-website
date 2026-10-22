import "server-only";
import { createClient } from "@supabase/supabase-js";

// Admin client with the service-role key, which bypasses row level security.
// Backend only: API routes, server libs and scripts. "server-only" fails the
// build if a client component imports this file, and the key has no
// NEXT_PUBLIC_ prefix, so Next.js never inlines it into browser bundles.
// Browser code uses @/lib/supabase (public anon key, Storage uploads only).
if (typeof window !== "undefined") {
  throw new Error("@/lib/supabase-admin must never be imported in the browser");
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
