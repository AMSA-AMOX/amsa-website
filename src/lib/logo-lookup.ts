const SCHOOL_DOMAIN_ALIASES: Record<string, string> = {
  "franklin and marshall college": "fandm.edu",
  "franklin & marshall college": "fandm.edu",
  "f and m": "fandm.edu",
  "f&m": "fandm.edu",
  fandm: "fandm.edu",
};

const normalizeEntityName = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const getKnownSchoolDomain = (name: string | null | undefined): string | null => {
  if (!name?.trim()) return null;
  return SCHOOL_DOMAIN_ALIASES[normalizeEntityName(name)] ?? null;
};

export const getLookupNameVariants = (name: string): string[] => {
  const base = name.trim();
  if (!base) return [];

  const variants = [
    base,
    base.replace(/\s*&\s*/g, " and "),
    base.replace(/\s+and\s+/gi, " & "),
    base.replace(/[^\w\s&]/g, " ").replace(/\s+/g, " ").trim(),
  ];

  return Array.from(new Set(variants.filter(Boolean)));
};
