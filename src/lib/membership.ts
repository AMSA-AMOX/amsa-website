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
  agreesToEmails: boolean;
};

const normalizeString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

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
    socialMedia: normalizeString(body.socialMedia),
    phone: normalizeString(body.phone),
    careerInterests: normalizeStringArray(body.careerInterests),
    careerInterestsOther: normalizeString(body.careerInterestsOther),
    amsaInterests: normalizeStringArray(body.amsaInterests),
    amsaInterestsOther: normalizeString(body.amsaInterestsOther),
    mentorshipInterest: normalizeString(body.mentorshipInterest),
    eventIdeas: normalizeString(body.eventIdeas),
    heardAboutAmsa: normalizeString(body.heardAboutAmsa),
    heardAboutAmsaOther: normalizeString(body.heardAboutAmsaOther),
    agreesToEmails: Boolean(body.agreesToEmails),
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
    "socialMedia",
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

  if (errors.length > 0) {
    return { ok: false as const, errors };
  }

  return { ok: true as const };
}
