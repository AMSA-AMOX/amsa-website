import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { verifyToken, assertRole } from "@/lib/auth";

export async function GET() {
  try {
    const { Announcement, User } = await getDb();
    const announcements = await Announcement.findAll({
      include: [
        {
          model: User,
          attributes: ["id", "firstName", "lastName", "eduEmail"],
        },
      ],
      order: [
        ["publishedAt", "DESC"],
        ["createdAt", "DESC"],
      ],
    });
    return NextResponse.json({ announcements });
  } catch (e: any) {
    console.error("GET /api/announcements failed:", e?.parent?.sqlMessage || e.message);
    return NextResponse.json(
      { message: "Failed to load announcements", error: e?.parent?.sqlMessage || e.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let userPayload;
  try {
    userPayload = verifyToken(request);
    assertRole(userPayload, "admin");
  } catch (res) {
    return res as NextResponse;
  }

  try {
    const body = await request.json();
    const { title, body: text, publishedAt } = body;

    if (!title || !text) {
      return NextResponse.json(
        { message: "Title and body are required" },
        { status: 400 }
      );
    }

    const { Announcement } = await getDb();
    const announcement = await Announcement.create({
      title,
      body: text,
      publishedAt: publishedAt || new Date(),
      authorId: userPayload.id,
    });

    return NextResponse.json({ announcement }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Failed to create announcement" }, { status: 500 });
  }
}
