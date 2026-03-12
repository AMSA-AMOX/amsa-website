import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: members, error } = await supabase
      .from('Roles')
      .select(`
        UserId,
        name,
        year,
        yearEnd,
        role,
        Users:UserId (
          firstName,
          lastName,
          email,
          schoolName,
          profilePic,
          linkedin
        )
      `);

    if (error) {
      console.error('Supabase error fetching members:', error);
      return NextResponse.json({ message: "Failed to fetch members", error: error.message }, { status: 500 });
    }

    if (!members) {
      return NextResponse.json({ tuz: {} });
    }

    const tuz_filter: any[] = [];
    const currentYear = new Date().getFullYear();

    for (let i = 0; i < members.length; i++) {
      // Normalize the nested Users object (Supabase returns an array for joins sometimes or an object, we want an object 'User')
      const memberData = members[i] as any;
      const userObj = Array.isArray(memberData.Users) ? memberData.Users[0] : memberData.Users;
      
      const member = {
        ...memberData,
        User: userObj || {},
      };
      // We don't need the nested Users prop anymore
      delete member.Users;

      if (member.role === 'tuz') {
        tuz_filter.push(member);
      }
    }

    const tuz_members_object: Record<string, any[]> = {};
    const years = Array.from(new Set(tuz_filter.map((x) => x.year).filter(Boolean)));

    for (let i = 0; i < years.length; i++) {
        tuz_members_object[years[i]] = [];
    }

    for (let i = 0; i < tuz_filter.length; i++) {
        const member = tuz_filter[i];
        if (member.year) {
            tuz_members_object[member.year].push(member);
        }
    }

    return NextResponse.json({ tuz: tuz_members_object });
  } catch (error: any) {
    console.error("Get members error:", error);
    return NextResponse.json({
      message: "Server not available",
      error: error.message
    }, { status: 500 });
  }
}
