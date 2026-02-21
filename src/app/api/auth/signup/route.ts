import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { makeToken, isAmsaAdminEmail } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName } = body;
    const eduEmail = email?.toLowerCase().trim();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Missing email or password" },
        { status: 400 }
      );
    }

    const { User } = await getDb();

    const exists = await User.findOne({
      where: { eduEmail },
      attributes: ["id", "eduEmail"],
    });
    if (exists) {
      return NextResponse.json(
        { message: "Email already in use" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const role = isAmsaAdminEmail(eduEmail) ? "admin" : "member";

    const user = await User.create({
      eduEmail,
      password: hashedPassword,
      firstName,
      lastName,
      role,
    });

    const token = makeToken({ id: (user as any).id, role: (user as any).role });

    return NextResponse.json(
      {
        message: "Signup successful",
        user: {
          id: (user as any).id,
          email: (user as any).eduEmail,
          role: (user as any).role,
          firstName: (user as any).firstName,
          lastName: (user as any).lastName,
        },
        token,
      },
      { status: 201 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Signup failed" }, { status: 500 });
  }
}
