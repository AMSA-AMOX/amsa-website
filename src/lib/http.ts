import { NextResponse } from "next/server";

/**
 * Cache-Control for public, user-independent GET responses. `s-maxage` lets
 * Vercel's CDN serve repeats without invoking the function at all;
 * `stale-while-revalidate` keeps serving the old copy while a background
 * refresh runs, so a cache miss under load never becomes a thundering herd.
 */
export const PUBLIC_CACHE = (sMaxAge: number, swr: number = sMaxAge * 7) => ({
  "Cache-Control": `public, s-maxage=${sMaxAge}, stale-while-revalidate=${swr}`,
});

export const ONE_HOUR = 3600;
export const ONE_DAY = 86400;
export const ONE_WEEK = 604800;

export function jsonCached(body: unknown, sMaxAge: number, swr?: number, init: ResponseInit = {}) {
  return NextResponse.json(body, {
    ...init,
    headers: { ...(init.headers as Record<string, string> | undefined), ...PUBLIC_CACHE(sMaxAge, swr) },
  });
}
