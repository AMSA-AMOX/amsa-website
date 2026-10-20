/**
 * One-off: fill `Users.schoolName` from the verified .edu email for users
 * approved before the application → profile sync existed.
 *
 *   npx tsx --conditions=react-server scripts/backfill-school-names.ts [--dry]
 *
 * (`--conditions=react-server` satisfies the `server-only` guard in src/lib.)
 */
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const { supabaseAdmin } = await import("../src/lib/supabase-admin");
  const { findCollegeByEmail } = await import("../src/lib/college-match");
  const dry = process.argv.includes("--dry");

  const { data: users, error } = await supabaseAdmin
    .from("Users")
    .select("id, schoolEmail")
    .is("schoolName", null)
    .not("schoolEmail", "is", null);
  if (error) throw error;

  let updated = 0;
  for (const u of users ?? []) {
    const college = await findCollegeByEmail(u.schoolEmail);
    if (!college) {
      console.log(`skip  #${u.id} ${u.schoolEmail} (no college for domain)`);
      continue;
    }
    console.log(`${dry ? "would" : "set  "} #${u.id} ${u.schoolEmail} → ${college.name}`);
    if (!dry) {
      const { error: updErr } = await supabaseAdmin.from("Users").update({ schoolName: college.name }).eq("id", u.id);
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
