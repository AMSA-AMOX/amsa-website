import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { verifyToken, assertRole } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { Announcement, User } = await getDb();
    const announcement = await Announcement.findByPk(Number(id), {
      include: [
        {
          model: User,
          attributes: ["id", "firstName", "lastName", "eduEmail"],
        },
      ],
    });
    if (!announcement) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ announcement });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Failed to load announcement" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let userPayload;
  try {
    userPayload = verifyToken(request);
    assertRole(userPayload, "admin");
  } catch (res) {
    return res as NextResponse;
  }

  try {
    const { Announcement } = await getDb();
    const announcement = await Announcement.findByPk(Number(id));
    if (!announcement) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    const body = await request.json();
    await (announcement as any).update(body);
    return NextResponse.json({ announcement });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Failed to update announcement" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let userPayload;
  try {
    userPayload = verifyToken(request);
    assertRole(userPayload, "admin");
  } catch (res) {
    return res as NextResponse;
  }

  try {
    const { Announcement } = await getDb();
    const announcement = await Announcement.findByPk(Number(id));
    if (!announcement) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    await (announcement as any).destroy();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Failed to delete announcement" }, { status: 500 });
  }
}
