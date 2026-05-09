import { NextRequest, NextResponse } from "next/server";

type PexelsPhoto = {
  id: number;
  src: { medium: string; large: string };
  photographer: string;
  photographer_url: string;
  alt: string;
};

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ photo: null });

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
    if (!p) return NextResponse.json({ photo: null });
    return NextResponse.json({
      photo: {
        id: p.id,
        thumb: p.src.medium,
        large: p.src.large,
        photographer: p.photographer,
        photographerUrl: p.photographer_url,
        alt: p.alt || q,
      },
    });
  } catch {
    return NextResponse.json({ photo: null });
  }
}
