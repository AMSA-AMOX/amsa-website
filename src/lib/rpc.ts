import "server-only";
import { supabase } from "@/lib/supabase";

export class RpcError extends Error {
  code?: string;
  constructor(fn: string, message: string, code?: string) {
    super(`rpc ${fn}: ${message}`);
    this.code = code;
  }
}

/**
 * Call one of the SQL functions in supabase/migrations/*_rpc.sql.
 * Each is a single PostgREST round trip that returns the finished JSON for a
 * page, replacing the 5–10 sequential queries the routes used to make.
 */
export async function rpc<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new RpcError(fn, error.message, error.code);
  return data as T;
}
