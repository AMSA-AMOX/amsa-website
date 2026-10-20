import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyToken, ROLES } from "@/lib/auth";
import { rpc } from "@/lib/rpc";

/** The word the settings page makes the user type; checked here too so every client (web, iOS) gets the same safeguard. */
const CONFIRMATION_WORD = "DELETE";

/** "https://…/object/public/avatars/<path>" → "<path>"; null for anything that isn't ours. */
function avatarStoragePath(publicUrl: string): string | null {
  const marker = "/object/public/avatars/";
  const idx = publicUrl.indexOf(marker);
  return idx !== -1 ? publicUrl.slice(idx + marker.length) : null;
}

/**
 * DELETE /api/user/account — permanently deletes the caller's account and
 * everything they own (see supabase/migrations/20260918_0006_delete_user_account.sql
 * for the exact list). Body: { confirmation: "DELETE" }.
 */
export async function DELETE(request: Request) {
  let payload;
  try {
    payload = verifyToken(request);
  } catch (res) {
    return res as NextResponse;
  }

  try {
    const body = await request.json().catch(() => ({}));
    if (body?.confirmation !== CONFIRMATION_WORD) {
      return NextResponse.json(
        { message: `Type ${CONFIRMATION_WORD} to confirm.` },
        { status: 400 },
      );
    }

    const { data: user, error } = await supabaseAdmin
      .from("Users")
      .select("id, role, profilePic")
      .eq("id", payload.id)
      .maybeSingle<{ id: number; role: string | null; profilePic: string | null }>();

    if (error) throw error;
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Admins own org content (events) and are the only ones who can restore
    // access; demote first, then delete.
    if (user.role === ROLES.ADMIN) {
      return NextResponse.json(
        { message: "Admin accounts can't be deleted from settings. Ask another admin to change your role first." },
        { status: 403 },
      );
    }

    const deleted = await rpc<boolean>("delete_user_account", { p_user_id: user.id });
    if (!deleted) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Best effort: the account is already gone, so a leftover avatar file is
    // not worth failing the request over.
    const avatarPath = user.profilePic ? avatarStoragePath(user.profilePic) : null;
    if (avatarPath) {
      const { error: storageError } = await supabaseAdmin.storage.from("avatars").remove([avatarPath]);
      if (storageError) console.error("DELETE /api/user/account: avatar cleanup failed", storageError);
    }

    return NextResponse.json({ message: "Account deleted" });
  } catch (e) {
    console.error("DELETE /api/user/account failed:", e);
    return NextResponse.json({ message: "Failed to delete account" }, { status: 500 });
  }
}
