import { NextResponse } from "next/server";
import slugify from "slugify";
import { getDb } from "@/lib/db";
import { verifyToken, assertRole } from "@/lib/auth";

export async function GET() {
  try {
    const { Blog, User } = await getDb();
    const blogs = await Blog.findAll({
      include: [
        {
          model: User,
          attributes: ["id", "firstName", "lastName", "eduEmail"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    return NextResponse.json({ blogs });
  } catch (e: any) {
    console.error("GET /api/blogs failed:", e?.parent?.sqlMessage || e.message);
    return NextResponse.json(
      { message: "Failed to load blogs", error: e?.parent?.sqlMessage || e.message },
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
    const { title, content, coverImageUrl } = body;

    if (!title || !content) {
      return NextResponse.json(
        { message: "Title and content are required" },
        { status: 400 }
      );
    }

    const { Blog } = await getDb();
    const slug = slugify(title, { lower: true, strict: true });

    const existing = await Blog.findOne({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { message: "A blog with this title already exists" },
        { status: 409 }
      );
    }

    const blog = await Blog.create({
      title,
      slug,
      content,
      coverImageUrl: coverImageUrl || null,
      authorId: userPayload.id,
    });

    return NextResponse.json({ blog }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Failed to create blog" }, { status: 500 });
  }
}
