import { NextRequest, NextResponse } from "next/server";
import { STATE_DATA } from "@/app/(dashboard)/dashboard/research/state-data";
import { jsonCached, ONE_DAY, ONE_WEEK } from "@/lib/http";

type PexelsPhoto = {
  id: number;
  src: { medium: string; large: string };
  photographer: string;
  photographer_url: string;
  alt: string;
};

/**
 * Only the place/city/state names we actually render may be queried. This
 * bounds the cache-key space (and Pexels spend) — an arbitrary `?q=` would
 * otherwise bypass the CDN and hit Pexels on every unique value.
 */
const ALLOWED_QUERIES = new Set<string>();
for (const info of Object.values(STATE_DATA)) {
  const state = info.name.toLowerCase();
  ALLOWED_QUERIES.add(state);
  for (const c of info.cities) ALLOWED_QUERIES.add(c.toLowerCase());
  for (const p of info.places) {
    ALLOWED_QUERIES.add(p.toLowerCase());
    ALLOWED_QUERIES.add(`${p.toLowerCase()} ${state}`); // places/[abbr] queries "<place> <state>"
  }
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || !ALLOWED_QUERIES.has(q.toLowerCase())) return NextResponse.json({ photo: null });

  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return NextResponse.json({ photo: null, error: "PEXELS_API_KEY not set" });

  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=1&orientation=landscape`;
    const res = await fetch(url, {
      headers: { Authorization: apiKey },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return NextResponse.json({ photo: null });
    const data = await res.json();
    const p: PexelsPhoto | undefined = data.photos?.[0];
    if (!p) return jsonCached({ photo: null }, ONE_DAY, ONE_WEEK);
    return jsonCached(
      {
        photo: {
          id: p.id,
          thumb: p.src.medium,
          large: p.src.large,
          photographer: p.photographer,
          photographerUrl: p.photographer_url,
          alt: p.alt || q,
        },
      },
      ONE_DAY,
      ONE_WEEK,
    );
  } catch {
    return NextResponse.json({ photo: null });
  }
}
