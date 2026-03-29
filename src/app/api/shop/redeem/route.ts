import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const SHOP_ITEMS = [
  { key: "agm_ticket", label: "Ticket to AGM", cost: 20 },
  { key: "amsa_merch", label: "AMSA Merch", cost: 35 },
  { key: "ig_shoutout", label: "Shoutout on IG", cost: 25 },
  { key: "ig_post", label: "Post on IG", cost: 40 },
] as const;

export async function POST(request: Request) {
  let payload;
  try {
    payload = verifyToken(request);
  } catch (res) {
    return res as NextResponse;
  }

  try {
    const body = await request.json();
    const itemKey = typeof body?.itemKey === "string" ? body.itemKey : "";
    const item = SHOP_ITEMS.find((entry) => entry.key === itemKey);
    if (!item) {
      return NextResponse.json({ message: "Invalid shop item." }, { status: 400 });
    }

    const { data: user, error } = await supabase
      .from("Users")
      .select("id, appreciationTokens")
      .eq("id", payload.id)
      .single<{ id: number; appreciationTokens: number | null }>();

    if (error || !user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const balance = user.appreciationTokens ?? 0;
    if (balance < item.cost) {
      return NextResponse.json(
        { message: "Not enough Tokens of Appreciation for this item." },
        { status: 400 }
      );
    }

    const nextBalance = balance - item.cost;
    const { error: updateError } = await supabase
      .from("Users")
      .update({ appreciationTokens: nextBalance })
      .eq("id", payload.id);
    if (updateError) throw updateError;

    const { error: requestError } = await supabase.from("ShopRedemptions").insert({
      userId: payload.id,
      itemKey: item.key,
      itemLabel: item.label,
      cost: item.cost,
      status: "requested",
    });
    if (requestError) throw requestError;

    return NextResponse.json({
      message: "Redemption request submitted.",
      tokens: nextBalance,
    });
  } catch (error) {
    console.error("POST /api/shop/redeem failed:", error);
    return NextResponse.json({ message: "Failed to redeem item." }, { status: 500 });
  }
}
