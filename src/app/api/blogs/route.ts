import { NextResponse } from "next/server";
import slugify from "slugify";
import { supabase } from "@/lib/supabase";
import { verifyToken, assertContentCreator } from "@/lib/auth";

export async function GET() {
  try {
    const { data: blogs, error } = await supabase
      .from("website_blogs")
      .select("*, Users(id, firstName, lastName, email)")
      .order("createdAt", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ blogs });
  } catch (e: any) {
    console.error("GET /api/blogs failed:", e.message);
    return NextResponse.json(
      { message: "Failed to load blogs", error: e.message },
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
    const { title, content, coverImageUrl } = body;

    if (!title || !content) {
      return NextResponse.json(
        { message: "Title and content are required" },
        { status: 400 }
      );
    }

    const slug = slugify(title, { lower: true, strict: true });

    const { data: existing } = await supabase
      .from("website_blogs")
      .select("id")
      .eq("slug", slug)
      .single();

    if (existing) {
      return NextResponse.json(
        { message: "A blog with this title already exists" },
        { status: 409 }
      );
    }

    const { data: blog, error } = await supabase
      .from("website_blogs")
      .insert({
        title,
        slug,
        content,
        coverImageUrl: coverImageUrl ?? null,
        authorId: userPayload.id,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ blog }, { status: 201 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { message: "Failed to create blog" },
      { status: 500 }
    );
  }
}
