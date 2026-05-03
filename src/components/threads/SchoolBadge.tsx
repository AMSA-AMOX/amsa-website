"use client";

const LOGO_DEV_TOKEN = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN?.trim();

function buildLogoUrl(domain: string): string {
  const base = `https://img.logo.dev/${domain}`;
  return LOGO_DEV_TOKEN ? `${base}?token=${encodeURIComponent(LOGO_DEV_TOKEN)}` : base;
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253M3 12a8.96 8.96 0 0 0 .284 2.253" />
    </svg>
  );
}

type Props = {
  category: string;
  categoryDomain: string | null;
  size?: "sm" | "md";
};

export default function SchoolBadge({ category, categoryDomain, size = "sm" }: Props) {
  const isGeneral = !category || category.toLowerCase() === "general";
  const logoUrl = !isGeneral && categoryDomain ? buildLogoUrl(categoryDomain) : null;

  const iconSize = size === "md" ? "w-4 h-4" : "w-3 h-3";
  const textSize = size === "md" ? "text-xs" : "text-[10px]";
  const padding = size === "md" ? "px-2.5 py-1" : "px-2 py-0.5";

  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-gray-100 text-gray-700 ${textSize} ${padding}`}>
      {isGeneral ? (
        <GlobeIcon className={iconSize} />
      ) : logoUrl ? (
        <img
          src={logoUrl}
          alt=""
          className={`${iconSize} object-contain rounded-sm`}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      ) : null}
      {isGeneral ? "General" : category}
    </span>
  );
}
