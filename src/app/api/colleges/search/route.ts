import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function rootDomain(website: string | null): string | null {
  if (!website) return null;
  try {
    const host = new URL(website.startsWith("http") ? website : `https://${website}`).hostname;
    return host.startsWith("www.") ? host.slice(4) : host;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ colleges: [] });

  const { data, error } = await supabase
    .from("colleges_base")
    .select("unitid, name, school_url")
    .ilike("name", `%${q}%`)
    .order("name")
    .limit(8);

  if (error) return NextResponse.json({ colleges: [] });

  return NextResponse.json({
    colleges: (data ?? []).map((r) => ({
      id: r.unitid as number,
      name: r.name as string,
      domain: rootDomain(r.school_url as string | null),
    })),
  });
}
