/**
 * One-off: populate Users.college_unitid / state_abbr / logo_domain for
 * existing rows. Run after applying supabase/migrations/20260913_0001_indexes.sql.
 *
 *   npx tsx --conditions=react-server scripts/backfill-user-denorm.ts [--dry]
 */
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const { supabaseAdmin } = await import("../src/lib/supabase-admin");
  const { resolveUserDenorm } = await import("../src/lib/user-denorm");
  const dry = process.argv.includes("--dry");

  const { data: users, error } = await supabaseAdmin
    .from("Users")
    .select("id, schoolName, schoolEmail, state")
    .or("schoolName.not.is.null,schoolEmail.not.is.null,state.not.is.null")
    .order("id");
  if (error) throw error;

  let updated = 0;
  for (const u of users ?? []) {
    const denorm = await resolveUserDenorm(u);
    if (!denorm.college_unitid && !denorm.state_abbr && !denorm.logo_domain) continue;
    console.log(`${dry ? "would" : "set  "} #${u.id} college=${denorm.college_unitid ?? "-"} state=${denorm.state_abbr ?? "-"} logo=${denorm.logo_domain ?? "-"}`);
    if (!dry) {
      const { error: updErr } = await supabaseAdmin.from("Users").update(denorm).eq("id", u.id);
      if (updErr) throw updErr;
    }
    updated += 1;
  }
  console.log(`${dry ? "would update" : "updated"} ${updated} of ${users?.length ?? 0}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
