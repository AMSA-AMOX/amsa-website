import { NextResponse } from "next/server";
import { assertRole, ROLES, verifyToken } from "@/lib/auth";

import { supabase } from "@/lib/supabase";
import { MEMBERSHIP_REVIEW_STATUSES, type MembershipReviewStatus } from "@/lib/membership";

type MembershipListRow = {
  id: string;
  user_id: number;
  created_at: string;
  full_name: string;
  pronouns: string | null;
  enrolled_university: string;
  year_in_school: string;
  state: string;
  city: string;
  major: string;
  expected_graduation: string;
  email: string;
  social_media: string;
  phone: string;
  career_interests: string[] | null;
  career_interests_other: string | null;
  amsa_interests: string[] | null;
  amsa_interests_other: string | null;
  mentorship_interest: string;
  event_ideas: string | null;
  heard_about_amsa: string;
  heard_about_amsa_other: string | null;
  agrees_to_emails: boolean;
  review_status: MembershipReviewStatus;
  reviewed_at: string | null;
  reviewed_by: number | null;
  assigned_role: string | null;
  admin_note: string | null;
};

type UserLookupRow = {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string | null;
  acceptanceStatus: string | null;
};

const LIST_COLUMNS = `
  id,
  user_id,
  created_at,
  full_name,
  pronouns,
  enrolled_university,
  year_in_school,
  state,
  city,
  major,
  expected_graduation,
  email,
  social_media,
  phone,
  career_interests,
  career_interests_other,
  amsa_interests,
  amsa_interests_other,
  mentorship_interest,
  event_ideas,
  heard_about_amsa,
  heard_about_amsa_other,
  agrees_to_emails,
  review_status,
  reviewed_at,
  reviewed_by,
  assigned_role,
  admin_note
`;

export async function GET(request: Request) {
  let payload;
  try {
    payload = verifyToken(request);
    assertRole(payload, ROLES.ADMIN);
  } catch (res) {
    return res as NextResponse;
  }

  try {
    const { searchParams } = new URL(request.url);
    const statusParam = (searchParams.get("status") || "pending").toLowerCase();

    let query = supabase
      .from("amsa_memberships")
      .select(LIST_COLUMNS)
      .order("created_at", { ascending: false });

    if (statusParam !== "all") {
      if (!MEMBERSHIP_REVIEW_STATUSES.includes(statusParam as MembershipReviewStatus)) {
        return NextResponse.json({ message: "Invalid status filter" }, { status: 400 });
      }
      query = query.eq("review_status", statusParam);
    }

    const { data, error } = await query.returns<MembershipListRow[]>();
    if (error) throw error;

    const memberships = data ?? [];
    const userIds = Array.from(new Set(memberships.map((item) => item.user_id)));
    const reviewerIds = Array.from(
      new Set(
        memberships
          .map((item) => item.reviewed_by)
          .filter((value): value is number => typeof value === "number"),
      ),
    );

    const idsToLookup = Array.from(new Set([...userIds, ...reviewerIds]));
    let usersById = new Map<number, UserLookupRow>();

    if (idsToLookup.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from("Users")
        .select("id, email, firstName, lastName, role, acceptanceStatus")
        .in("id", idsToLookup)
        .returns<UserLookupRow[]>();

      if (usersError) throw usersError;
      usersById = new Map((users ?? []).map((row) => [row.id, row]));
    }

    return NextResponse.json({
      submissions: memberships.map((row) => ({
        id: row.id,
        userId: row.user_id,
        createdAt: row.created_at,
        fullName: row.full_name,
        pronouns: row.pronouns,
        enrolledUniversity: row.enrolled_university,
        yearInSchool: row.year_in_school,
        state: row.state,
        city: row.city,
        major: row.major,
        expectedGraduation: row.expected_graduation,
        email: row.email,
        socialMedia: row.social_media,
        phone: row.phone,
        careerInterests: row.career_interests ?? [],
        careerInterestsOther: row.career_interests_other,
        amsaInterests: row.amsa_interests ?? [],
        amsaInterestsOther: row.amsa_interests_other,
        mentorshipInterest: row.mentorship_interest,
        eventIdeas: row.event_ideas,
        heardAboutAmsa: row.heard_about_amsa,
        heardAboutAmsaOther: row.heard_about_amsa_other,
        agreesToEmails: row.agrees_to_emails,
        reviewStatus: row.review_status,
        reviewedAt: row.reviewed_at,
        reviewedBy: row.reviewed_by,
        assignedRole: row.assigned_role,
        adminNote: row.admin_note,
        user: usersById.get(row.user_id) ?? null,
        reviewer: row.reviewed_by ? usersById.get(row.reviewed_by) ?? null : null,
      })),
    });
  } catch (error) {
    console.error("GET /api/admin/verification failed:", error);
    return NextResponse.json({ message: "Failed to load verification submissions" }, { status: 500 });
  }
}
