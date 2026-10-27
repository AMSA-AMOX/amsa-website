export const MENTORSHIP_INTEREST_OPTIONS = [
  "Yes",
  "Maybe",
  "Not at the moment",
] as const;

export const MEMBERSHIP_REVIEW_STATUSES = [
  "pending",
  "approved",
  "rejected",
] as const;

export const MEMBERSHIP_ASSIGNED_ROLES = ["us_member", "member"] as const;

export const CAREER_INTEREST_OPTIONS = [
  "Business / Finance",
  "Technology / Computer Science",
  "Engineering",
  "Medicine / Healthcare",
  "Law / Policy",
  "Research / Academia",
  "Entrepreneurship / Startups",
  "Design / Creative fields",
  "Nonprofit / Social Impact",
  "Environmental / Sustainability",
  "Other:",
] as const;

export const AMSA_INTEREST_OPTIONS = [
  "Mentorship",
  "Networking",
  "Events",
  "Leadership Opportunities",
  "Advocacy",
  "Research",
  "Community Service",
  "Other",
] as const;

export const HEARD_ABOUT_AMSA_OPTIONS = [
  "Instagram",
  "Friend",
  "School Club Fair",
  "AMSA Event",
  "Referral from Member",
  "Other",
] as const;

export type MentorshipInterest = (typeof MENTORSHIP_INTEREST_OPTIONS)[number];
export type MembershipReviewStatus = (typeof MEMBERSHIP_REVIEW_STATUSES)[number];
export type MembershipAssignedRole = (typeof MEMBERSHIP_ASSIGNED_ROLES)[number];

export type MembershipSubmissionPayload = {
  fullName: string;
  pronouns: string;
  enrolledUniversity: string;
  yearInSchool: string;
  state: string;
  city: string;
  major: string;
  expectedGraduation: string;
  email: string;
  /** Instagram handle, always stored normalized as "@name". */
  socialMedia: string;
  phone: string;
  careerInterests: string[];
  careerInterestsOther: string;
  amsaInterests: string[];
  amsaInterestsOther: string;
  mentorshipInterest: string;
  eventIdeas: string;
  heardAboutAmsa: string;
  heardAboutAmsaOther: string;
};

const normalizeString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

/**
 * Reduce any way people write an Instagram handle — "@name", "name",
 * "instagram.com/name/", "https://www.instagram.com/name?igsh=…" — to "@name".
 * Returns "" when nothing usable is left.
 */
export function normalizeInstagramHandle(value: unknown): string {
  let raw = normalizeString(value);
  if (!raw) return "";
  const urlMatch = raw.match(/instagram\.com\/([^/?#\s]+)/i);
  if (urlMatch) raw = urlMatch[1];
  const handle = raw.replace(/^@+/, "").replace(/\/+$/, "").trim();
  return handle ? `@${handle}` : "";
}

export const INSTAGRAM_HANDLE_PATTERN = /^@[A-Za-z0-9._]{1,30}$/;

export const instagramUrl = (handle: string) =>
  `https://instagram.com/${handle.replace(/^@/, "")}`;

const normalizeStringArray = (value: unknown) => {
  if (!Array.isArray(value)) return [] as string[];
  return Array.from(
    new Set(
      value
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean),
    ),
  );
};

export function normalizeMembershipSubmissionPayload(
  input: unknown,
): MembershipSubmissionPayload {
  const body = (input ?? {}) as Record<string, unknown>;
  return {
    fullName: normalizeString(body.fullName),
    pronouns: normalizeString(body.pronouns),
    enrolledUniversity: normalizeString(body.enrolledUniversity),
    yearInSchool: normalizeString(body.yearInSchool),
    state: normalizeString(body.state),
    city: normalizeString(body.city),
    major: normalizeString(body.major),
    expectedGraduation: normalizeString(body.expectedGraduation),
    email: normalizeString(body.email).toLowerCase(),
    socialMedia: normalizeInstagramHandle(body.socialMedia),
    phone: normalizeString(body.phone),
    careerInterests: normalizeStringArray(body.careerInterests),
    careerInterestsOther: normalizeString(body.careerInterestsOther),
    amsaInterests: normalizeStringArray(body.amsaInterests),
    amsaInterestsOther: normalizeString(body.amsaInterestsOther),
    mentorshipInterest: normalizeString(body.mentorshipInterest),
    eventIdeas: normalizeString(body.eventIdeas),
    heardAboutAmsa: normalizeString(body.heardAboutAmsa),
    heardAboutAmsaOther: normalizeString(body.heardAboutAmsaOther),
  };
}

export function validateMembershipSubmissionPayload(
  payload: MembershipSubmissionPayload,
) {
  const errors: string[] = [];
  const requiredTextFields: Array<keyof MembershipSubmissionPayload> = [
    "fullName",
    "enrolledUniversity",
    "yearInSchool",
    "state",
    "city",
    "major",
    "expectedGraduation",
    "email",
    "phone",
    "heardAboutAmsa",
  ];

  for (const field of requiredTextFields) {
    if (!payload[field]) {
      errors.push(`${field} is required`);
    }
  }

  if (!MENTORSHIP_INTEREST_OPTIONS.includes(payload.mentorshipInterest as MentorshipInterest)) {
    errors.push("mentorshipInterest is invalid");
  }

  // School email must end in .edu
  if (payload.email && !payload.email.toLowerCase().endsWith(".edu")) {
    errors.push("email must be a school email address ending in .edu");
  }

  if (payload.socialMedia && !INSTAGRAM_HANDLE_PATTERN.test(payload.socialMedia)) {
    errors.push("socialMedia must be a valid Instagram handle (letters, numbers, dots, underscores)");
  }

  if (errors.length > 0) {
    return { ok: false as const, errors };
  }

  return { ok: true as const };
}

// ─── Application → profile sync ──────────────────────────────────────────────

/** Year-in-school values that map 1:1 onto the profile's `schoolYear` field. */
const PROFILE_SCHOOL_YEARS = new Set([
  "Freshman",
  "Sophomore",
  "Junior",
  "Senior",
  "Graduate Student",
]);

/** Roles that must never be overwritten by a membership review decision. */
export const PROTECTED_ROLES = ["admin", "board_member", "ambassador"] as const;

export const isProtectedRole = (role: string | null | undefined) =>
  PROTECTED_ROLES.includes((role ?? "") as (typeof PROTECTED_ROLES)[number]);

/**
 * Map a submitted US Member application onto the `Users` profile columns so the
 * information the applicant just typed shows up on their profile immediately.
 * Fields that can't be mapped cleanly (e.g. "Other" year, free-text graduation
 * without a year) are left out so existing profile values aren't wiped.
 */
export function membershipToProfileUpdates(
  payload: MembershipSubmissionPayload,
): Record<string, string> {
  const updates: Record<string, string> = {
    schoolEmail: payload.email,
    schoolName: payload.enrolledUniversity,
    major: payload.major,
    state: payload.state,
    city: payload.city,
    phoneNumber: payload.phone,
  };

  if (PROFILE_SCHOOL_YEARS.has(payload.yearInSchool)) {
    updates.schoolYear = payload.yearInSchool;
  }

  // "June 2029" / "Spring '29" / "2029" → "2029"
  const yearMatch = payload.expectedGraduation.match(/\b(20\d{2})\b/);
  if (yearMatch) {
    updates.graduationYear = yearMatch[1];
  } else {
    const shortYear = payload.expectedGraduation.match(/'(\d{2})\b/);
    if (shortYear) updates.graduationYear = `20${shortYear[1]}`;
  }

  // Stored as a full URL so the profile's social link resolves.
  if (payload.socialMedia) updates.instagram = instagramUrl(payload.socialMedia);

  return updates;
}
