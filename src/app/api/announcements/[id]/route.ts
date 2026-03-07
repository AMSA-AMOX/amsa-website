import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyToken, assertRole } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { data: announcement, error } = await supabase
      .from("Announcements")
      .select("*, Users(id, firstName, lastName, email)")
      .eq("id", Number(id))
      .single();

    if (error || !announcement) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ announcement });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { message: "Failed to load announcement" },
      { status: 500 }
    );
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
    const body = await request.json();
    const { data: announcement, error } = await supabase
      .from("Announcements")
      .update(body)
      .eq("id", Number(id))
      .select()
      .single();

    if (error || !announcement) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ announcement });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { message: "Failed to update announcement" },
      { status: 500 }
    );
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
    const { error } = await supabase
      .from("Announcements")
      .delete()
      .eq("id", Number(id));

    if (error) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { message: "Failed to delete announcement" },
      { status: 500 }
    );
  }
}
