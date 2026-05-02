import { NextRequest, NextResponse } from "next/server";

export type CollegePhoto = {
  id: number;
  thumb: string;
  large: string;
  photographer: string;
  photographerUrl: string;
  alt: string;
};

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name");
  if (!name) return NextResponse.json({ photos: [] });

  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return NextResponse.json({ photos: [], error: "PEXELS_API_KEY not set" });

  const query = `${name} campus`;
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=12&orientation=landscape`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: apiKey },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return NextResponse.json({ photos: [] });

    const data = await res.json();
    const photos: CollegePhoto[] = (data.photos ?? []).map((p: {
      id: number;
      src: { medium: string; large: string };
      photographer: string;
      photographer_url: string;
      alt: string;
    }) => ({
      id: p.id,
      thumb: p.src.medium,
      large: p.src.large,
      photographer: p.photographer,
      photographerUrl: p.photographer_url,
      alt: p.alt || `${name} campus`,
    }));

    return NextResponse.json({ photos });
  } catch {
    return NextResponse.json({ photos: [] });
  }
}
