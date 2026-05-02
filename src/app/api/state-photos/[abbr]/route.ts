import { NextRequest, NextResponse } from "next/server";
import { STATE_DATA } from "@/app/(dashboard)/dashboard/research/state-data";

type RouteContext = { params: Promise<{ abbr: string }> };

export type StatePhoto = {
  id: number;
  thumb: string;
  large: string;
  photographer: string;
  photographerUrl: string;
  alt: string;
};

type PexelsPhoto = {
  id: number;
  src: { medium: string; large: string };
  photographer: string;
  photographer_url: string;
  alt: string;
};

function mapPhoto(p: PexelsPhoto, fallbackAlt: string): StatePhoto {
  return {
    id: p.id,
    thumb: p.src.medium,
    large: p.src.large,
    photographer: p.photographer,
    photographerUrl: p.photographer_url,
    alt: p.alt || fallbackAlt,
  };
}

async function pexelsSearch(query: string, perPage: number, apiKey: string): Promise<StatePhoto[]> {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`;
  const res = await fetch(url, {
    headers: { Authorization: apiKey },
    next: { revalidate: 86400 },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.photos ?? []).map((p: PexelsPhoto) => mapPhoto(p, query));
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { abbr } = await params;
  const key = abbr.toUpperCase();
  const info = STATE_DATA[key];
  if (!info) return NextResponse.json({ photos: [] });

  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return NextResponse.json({ photos: [], error: "PEXELS_API_KEY not set" });

  try {
    const [cityPhotos, travelPhotos] = await Promise.all([
      pexelsSearch(`${info.name} state cities`, 8, apiKey),
      pexelsSearch(`${info.name} state`, 8, apiKey),
    ]);

    // Interleave: city, travel, city, travel...
    const seen = new Set<number>();
    const photos: StatePhoto[] = [];
    const maxLen = Math.max(cityPhotos.length, travelPhotos.length);
    for (let i = 0; i < maxLen; i++) {
      if (cityPhotos[i] && !seen.has(cityPhotos[i].id)) {
        seen.add(cityPhotos[i].id);
        photos.push(cityPhotos[i]);
      }
      if (travelPhotos[i] && !seen.has(travelPhotos[i].id)) {
        seen.add(travelPhotos[i].id);
        photos.push(travelPhotos[i]);
      }
    }

    return NextResponse.json({ photos });
  } catch {
    return NextResponse.json({ photos: [] });
  }
}
