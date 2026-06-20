// ─────────────────────────────────────────────────────────────────────────────
// Social link helpers
// Turn a stored social URL (or raw handle) into a clean, human-readable handle
// for display, e.g. "https://instagram.com/john.doe/" → "@john.doe".
// ─────────────────────────────────────────────────────────────────────────────

export type SocialPlatform = "x" | "linkedin" | "instagram" | "facebook";

/** Ensure a stored value is a usable href (prepend https:// when missing). */
export function socialHref(value: string): string {
  const v = value.trim();
  if (/^https?:\/\//i.test(v)) return v;
  if (v.startsWith("@")) return v.slice(1); // bare handle isn't a valid URL on its own
  return `https://${v}`;
}

/**
 * Derive a display handle from a social link.
 * Falls back to the platform's default label when nothing meaningful can be parsed.
 */
export function socialHandle(value: string | null | undefined, platform: SocialPlatform): string {
  const fallback = { x: "X", linkedin: "LinkedIn", instagram: "Instagram", facebook: "Facebook" }[platform];
  if (!value) return fallback;

  const raw = value.trim();
  if (!raw) return fallback;

  // Bare handle already (e.g. "@john" or "john.doe")
  if (!raw.includes("/") && !raw.includes(".com") && !raw.includes("http")) {
    const h = raw.replace(/^@/, "");
    return platform === "x" || platform === "instagram" ? `@${h}` : h;
  }

  let segments: string[] = [];
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    segments = url.pathname.split("/").filter(Boolean);
  } catch {
    segments = raw.split("/").filter(Boolean);
  }

  if (segments.length === 0) return fallback;

  // LinkedIn: handle lives after /in/ or /company/
  if (platform === "linkedin") {
    const idx = segments.findIndex((s) => s === "in" || s === "company" || s === "pub");
    const handle = idx >= 0 && segments[idx + 1] ? segments[idx + 1] : segments[segments.length - 1];
    return handle || fallback;
  }

  // Facebook: profile.php?id=... has no readable handle
  if (platform === "facebook") {
    const first = segments[0];
    if (!first || first === "profile.php") return fallback;
    return first;
  }

  // X / Instagram: first path segment is the username
  const handle = segments[0].replace(/^@/, "");
  return handle ? `@${handle}` : fallback;
}
