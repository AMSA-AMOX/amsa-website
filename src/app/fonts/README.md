# Bundled fonts

The root layout loads these variable fonts with `next/font/local`, so builds do
not fetch or parse Google Fonts CSS. This avoids the Next.js 15.5.12 Google font
loader failure seen on Vercel (`Cannot read properties of null (reading '1')`).

Both unmodified normal-style TTF files come from the official `google/fonts`
repository at commit `45e3d5269e4a17d823f6d84470bc084dc5ae46f6`:

- `Urbanist.ttf`: `ofl/urbanist/Urbanist[wght].ttf`; license: `Urbanist-OFL.txt`.
- `YsabeauSC.ttf`: `ofl/ysabeausc/YsabeauSC[wght].ttf`; license: `YsabeauSC-OFL.txt`.

The layout retains the existing CSS variable names and weight ranges. Keep each
font's SIL Open Font License with it when updating or redistributing the files.
