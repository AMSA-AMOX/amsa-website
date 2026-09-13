/**
 * One-time asset optimizer for the marketing pages.
 *
 *   npm run images:build
 *
 * Reads the multi-MB originals under assets-src/ (git-tracked, not deployed)
 * and writes right-sized WebP copies
 * to public/assets/optimized and public/team/optimized. Commit the outputs;
 * CI does not run this. Re-run whenever a source image changes.
 *
 * Width targets are ~2× the largest CSS size each image is rendered at.
 */
import sharp from "sharp";
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";

const SRC = path.resolve("assets-src");
const PUBLIC = path.resolve("public");

/** [source, output, maxWidth, quality] */
const JOBS = [
  // Backgrounds (Figma SVG exports with embedded base64 rasters — 19 MB and 2.8 MB)
  ["assets/footerbg.svg", "assets/optimized/footerbg.webp", 1600, 70],
  ["assets/herobg.svg", "assets/optimized/herobg.webp", 1920, 70],

  // Hero carousel (rendered ≤1200 px wide)
  ["assets/Hero-alt2.png", "assets/optimized/Hero-alt2.webp", 1600, 80],
  ["assets/Hero-alt1.png", "assets/optimized/Hero-alt1.webp", 1600, 80],
  ["assets/2014agm.jpg", "assets/optimized/2014agm.webp", 1600, 80],
  ["assets/2017agm.JPG", "assets/optimized/2017agm.webp", 1600, 80],
  ["assets/2025agm.jpg", "assets/optimized/2025agm.webp", 1600, 80],

  // Floating gallery circles (rendered 125–170 px)
  ...[1, 2, 3, 5, 6, 7].map((n) => [
    `assets/FloatingGallery/Floating${n}.png`,
    `assets/optimized/Floating${n}.webp`,
    400,
    80,
  ]),

  // Program tiles (rendered ≤ ~600 px in a grid)
  ["assets/programs/cyf2025.jpg", "assets/optimized/cyf2025.webp", 1200, 80],
  ["assets/programs/BUOP.png", "assets/optimized/BUOP.webp", 1200, 80],
  ["assets/programs/1.png", "assets/optimized/programs-1.webp", 1200, 80],
  ["assets/programs/CuriosityCorner.png", "assets/optimized/CuriosityCorner.webp", 1200, 80],
  ["assets/programs/GlobalMind.png", "assets/optimized/GlobalMind.webp", 1200, 80],
  ["assets/programs/Temege.png", "assets/optimized/Temege.webp", 1200, 80],

  // University logo marquee PNGs (rendered ~120 px tall); SVGs are left as-is.
  ...["aclogo", "columbia", "harvardlogo", "mit", "yale", "cornell", "gmu", "wesleyan"].map((n) => [
    `assets/universities/${n}.png`,
    `assets/optimized/universities/${n}.webp`,
    320,
    85,
  ]),

  // Team portraits (rendered 256×300; SVG wrappers around 0.2–9 MB rasters)
  ...["ozi", "arvin", "bilgee", "marla", "alex", "nomiko", "telmen", "mike"].map((n) => [
    `team/${n}.svg`,
    `team/optimized/${n}.webp`,
    600,
    82,
  ]),
];

const kb = (n) => `${Math.round(n / 1024)} KB`;

async function optimize([src, out, maxWidth, quality]) {
  const input = path.join(SRC, src);
  const output = path.join(PUBLIC, out);
  await mkdir(path.dirname(output), { recursive: true });

  const meta = await sharp(input).metadata();
  // SVGs render at their intrinsic size; raise the density so small SVG
  // wrappers (147 px team portraits) are rasterized at the target width.
  const density =
    meta.format === "svg" && meta.width && meta.width < maxWidth
      ? Math.ceil(72 * (maxWidth / meta.width))
      : undefined;

  await sharp(input, density ? { density } : undefined)
    .resize({ width: maxWidth, withoutEnlargement: meta.format !== "svg" })
    .webp({ quality, effort: 6 })
    .toFile(output);

  const [before, after] = await Promise.all([stat(input), stat(output)]);
  console.log(`${src.padEnd(44)} ${kb(before.size).padStart(9)} → ${kb(after.size).padStart(8)}  ${out}`);
  return [before.size, after.size];
}

let totalBefore = 0;
let totalAfter = 0;
for (const job of JOBS) {
  const [b, a] = await optimize(job);
  totalBefore += b;
  totalAfter += a;
}
console.log(`\nTotal ${kb(totalBefore)} → ${kb(totalAfter)}`);
