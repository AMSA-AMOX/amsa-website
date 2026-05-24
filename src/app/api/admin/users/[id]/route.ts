import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { ROLES, verifyToken } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

const VALID_ROLES = [ROLES.ADMIN, ROLES.BOARD_MEMBER, ROLES.AMBASSADOR, ROLES.US_MEMBER, ROLES.ALUM, ROLES.MEMBER];

// PATCH /api/admin/users/[id] — change a user's role
export async function PATCH(request: Request, context: RouteContext) {
  let payload;
  try {
    payload = verifyToken(request);
  } catch (res) {
    return res as NextResponse;
  }

  if (payload.role !== ROLES.ADMIN) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const targetId = Number(id);
  if (!Number.isFinite(targetId)) {
    return NextResponse.json({ message: "Invalid user ID." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const role = typeof body?.role === "string" ? body.role : null;

    if (!role || !VALID_ROLES.includes(role as any)) {
      return NextResponse.json(
        { message: `Role must be one of: ${VALID_ROLES.join(", ")}` },
        { status: 400 }
      );
    }

    // Derive the roles array from the new primary role
    const rolesArray = role === ROLES.ADMIN ? [ROLES.ADMIN, ROLES.US_MEMBER] : [role];

    const { data, error } = await supabase
      .from("Users")
      .update({ role, roles: rolesArray })
      .eq("id", targetId)
      .select("id, firstName, lastName, email, role, roles")
      .single();

    if (error || !data) {
      console.error("PATCH /api/admin/users/[id] failed:", error);
      return NextResponse.json({ message: "Failed to update role." }, { status: 500 });
    }

    return NextResponse.json({ user: data });
  } catch (e) {
    console.error("PATCH /api/admin/users/[id] exception:", e);
    return NextResponse.json({ message: "Failed to update role." }, { status: 500 });
  }
}
