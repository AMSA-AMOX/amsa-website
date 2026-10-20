/**
 * One-off: populate Experiences.logoDomain for existing rows. Run after
 * applying supabase/migrations/20260914_0003_experience_logo.sql.
 *
 *   npx tsx --conditions=react-server scripts/backfill-experience-logos.ts [--dry]
 */
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const { supabaseAdmin } = await import("../src/lib/supabase-admin");
  const { resolveExperienceLogoDomain } = await import("../src/lib/experience-denorm");
  const dry = process.argv.includes("--dry");

  const { data: rows, error } = await supabaseAdmin
    .from("Experiences")
    .select("id, company, companyUrl, logoDomain")
    .order("id");
  if (error) throw error;

  let updated = 0;
  for (const row of rows ?? []) {
    const logoDomain = await resolveExperienceLogoDomain(row);
    if (!logoDomain || logoDomain === row.logoDomain) continue;
    console.log(`${dry ? "would" : "set  "} #${row.id} ${row.company} → ${logoDomain}`);
    if (!dry) {
      const { error: updErr } = await supabaseAdmin.from("Experiences").update({ logoDomain }).eq("id", row.id);
      if (updErr) throw updErr;
    }
    updated += 1;
  }
  console.log(`${dry ? "would update" : "updated"} ${updated} of ${rows?.length ?? 0}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
