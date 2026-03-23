import "server-only";
import { supabase } from "@/lib/supabase";

let followsTableName: string | null = null;
let followsTablePromise: Promise<string> | null = null;

export const FOLLOWS_TABLE_CANDIDATES = ["follows", "Follows"] as const;

export function getFollowsTableName(): Promise<string> {
  if (followsTableName) return Promise.resolve(followsTableName);
  if (followsTablePromise) return followsTablePromise;

  followsTablePromise = (async () => {
    for (const tableName of FOLLOWS_TABLE_CANDIDATES) {
      const { error } = await supabase
        .from(tableName)
        .select("id", { head: true, count: "exact" });

      if (!error) {
        followsTableName = tableName;
        return tableName;
      }
      if (error.code !== "PGRST205") {
        // If this is not a "table not found" error, surface it to caller.
        throw error;
      }
    }

    const missingTableError = new Error("Could not resolve follows table name") as Error & { code?: string };
    missingTableError.code = "PGRST205";
    throw missingTableError;
  })();

  return followsTablePromise.finally(() => {
    // Do not keep a rejected promise forever.
    followsTablePromise = null;
  });
}
