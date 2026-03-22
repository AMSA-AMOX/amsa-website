import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyToken, assertContentCreator } from "@/lib/auth";

export async function GET() {
  try {
    const { data: announcements, error } = await supabase
      .from("Announcements")
      .select("*, Users(id, firstName, lastName, email)")
      .order("publishedAt", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ announcements });
  } catch (e: any) {
    console.error("GET /api/announcements failed:", e.message);
    return NextResponse.json(
      { message: "Failed to load announcements", error: e.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let userPayload;
  try {
    userPayload = verifyToken(request);
    assertContentCreator(userPayload);
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

    const { data: announcement, error } = await supabase
      .from("Announcements")
      .insert({
        title,
        body: text,
        publishedAt: publishedAt ?? new Date().toISOString(),
        authorId: userPayload.id,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ announcement }, { status: 201 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { message: "Failed to create announcement" },
      { status: 500 }
    );
  }
}
