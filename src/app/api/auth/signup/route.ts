import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";
import { makeToken, isAmsaAdminEmail } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      firstName,
      lastName,
      personalEmail,
      phone,
      birthDate,
      address1,
      address2,
      city,
      state,
      zip,
      schoolName,
      schoolCity,
      schoolState,
      degree,
      gradYear,
      schoolYear,
      major,
      secondMajor,
      facebook,
      instagram,
      linkedin,
      isUsCollegeStudent,
    } = body;

    const eduEmail = email?.toLowerCase().trim();

    if (!eduEmail || !password) {
      return NextResponse.json(
        { message: "Missing email or password" },
        { status: 400 }
      );
    }

    // Check for existing user
    const { data: existing } = await supabase
      .from("Users")
      .select("id")
      .eq("email", eduEmail)
      .single();

    if (existing) {
      return NextResponse.json(
        { message: "Email already in use" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const role = isAmsaAdminEmail(eduEmail) ? "admin" : "member";

    const { data: user, error: userError } = await supabase
      .from("Users")
      .insert({
        email: eduEmail,
        password: hashedPassword,
        firstName,
        lastName,
        personalEmail: personalEmail ?? null,
        phoneNumber: phone ?? null,
        birthday: birthDate ?? null,
        address1: address1 ?? null,
        address2: address2 ?? null,
        city: city ?? null,
        state: state ?? null,
        zipCode: zip ?? null,
        schoolName: schoolName ?? null,
        schoolCity: schoolCity ?? null,
        schoolState: schoolState ?? null,
        degreeLevel: degree ?? null,
        graduationYear: gradYear ?? null,
        schoolYear: schoolYear ?? null,
        major: major ?? null,
        major2: secondMajor ?? null,
        facebook: facebook ?? null,
        instagram: instagram ?? null,
        linkedin: linkedin ?? null,
        role,
        acceptanceStatus: "pending",
        emailVerified: false,
        isUsCollegeStudent: isUsCollegeStudent ?? true,
      })
      .select("id, email, firstName, lastName, role, acceptanceStatus")
      .single();

    if (userError || !user) {
      console.error(userError);
      return NextResponse.json({ message: "Signup failed" }, { status: 500 });
    }

    // Create the extended website member profile linked by userId
    await supabase.from("website_member_profiles").insert({
      userId: user.id,
      personalEmail: personalEmail ?? null,
      phone: phone ?? null,
      birthDate: birthDate ?? null,
      address1: address1 ?? null,
      address2: address2 ?? null,
      city: city ?? null,
      state: state ?? null,
      zip: zip ?? null,
      schoolName: schoolName ?? null,
      schoolCity: schoolCity ?? null,
      schoolState: schoolState ?? null,
      degree: degree ?? null,
      gradYear: gradYear ?? null,
      schoolYear: schoolYear ?? null,
      major: major ?? null,
      secondMajor: secondMajor ?? null,
      facebook: facebook ?? null,
      instagram: instagram ?? null,
      linkedin: linkedin ?? null,
    });

    const token = makeToken({ id: user.id, role });

    return NextResponse.json(
      {
        message: "Signup successful",
        user: {
          id: user.id,
          email: eduEmail,
          role,
          firstName,
          lastName,
          acceptanceStatus: "pending",
          profilePic: null,
          level: null,
          bio: null,
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
