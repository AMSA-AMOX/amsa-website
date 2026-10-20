import { createClient } from "@supabase/supabase-js";

// Standard client with the public anon key, safe in the browser. Tables are
// closed to the anon role (row level security), so this is for Storage uploads
// only. Backend code uses supabaseAdmin from @/lib/supabase-admin.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, anonKey);
