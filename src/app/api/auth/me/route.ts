import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET(request: Request) {
  let userPayload;
  try {
    userPayload = verifyToken(request);
  } catch (res) {
    return res as NextResponse;
  }

  try {
    const { User } = await getDb();
    const user = await User.findByPk(userPayload.id, {
      attributes: ["id", "eduEmail", "role", "firstName", "lastName"],
    });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ user });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Failed to load user" }, { status: 500 });
  }
}
