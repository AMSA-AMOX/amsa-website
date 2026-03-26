import { NextResponse } from "next/server";
import { assertRole, ROLES, verifyToken } from "@/lib/auth";
import { MEMBERSHIP_ASSIGNED_ROLES } from "@/lib/membership";
import { supabase } from "@/lib/supabase";

type ReviewBody = {
  reviewStatus?: "approved" | "rejected";
  assignedRole?: "us_member" | "member";
  adminNote?: string;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let payload;
  try {
    payload = verifyToken(request);
    assertRole(payload, ROLES.ADMIN);
  } catch (res) {
    return res as NextResponse;
  }

  try {
    const { id } = await params;
    const body = (await request.json()) as ReviewBody;
    const reviewStatus = body.reviewStatus;
    const assignedRole = body.assignedRole;
    const adminNote = body.adminNote?.trim() || null;

    if (!reviewStatus || !["approved", "rejected"].includes(reviewStatus)) {
      return NextResponse.json({ message: "reviewStatus must be approved or rejected" }, { status: 400 });
    }

    if (reviewStatus === "approved" && !MEMBERSHIP_ASSIGNED_ROLES.includes((assignedRole ?? "") as "us_member" | "member")) {
      return NextResponse.json({ message: "assignedRole must be us_member or member when approving" }, { status: 400 });
    }

    const { data: existing, error: existingError } = await supabase
      .from("amsa_memberships")
      .select("id, user_id")
      .eq("id", id)
      .single<{ id: string; user_id: number }>();

    if (existingError || !existing) {
      return NextResponse.json({ message: "Verification submission not found" }, { status: 404 });
    }

    const now = new Date().toISOString();
    const membershipUpdates =
      reviewStatus === "approved"
        ? {
            review_status: "approved",
            assigned_role: assignedRole,
            admin_note: adminNote,
            reviewed_at: now,
            reviewed_by: payload.id,
          }
        : {
            review_status: "rejected",
            assigned_role: null,
            admin_note: adminNote,
            reviewed_at: now,
            reviewed_by: payload.id,
          };

    const { error: membershipError } = await supabase
      .from("amsa_memberships")
      .update(membershipUpdates)
      .eq("id", id);

    if (membershipError) throw membershipError;

    const userUpdates =
      reviewStatus === "approved"
        ? { role: assignedRole, acceptanceStatus: "approved", emailVerified: true }
        : { role: "member", acceptanceStatus: "approved" };

    const { error: userError } = await supabase
      .from("Users")
      .update(userUpdates)
      .eq("id", existing.user_id);

    if (userError) throw userError;

    return NextResponse.json({ message: "Verification review saved" });
  } catch (error) {
    console.error("PATCH /api/admin/verification/[id] failed:", error);
    return NextResponse.json({ message: "Failed to update verification review" }, { status: 500 });
  }
}
