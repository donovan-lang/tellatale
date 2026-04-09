import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
const SITE_URL = "https://makeatale.com";

const TIERS: Record<string, { credits: number; price_cents: number; name: string }> = {
  starter: { credits: 100, price_cents: 499, name: "100 Story Credits" },
  value: { credits: 250, price_cents: 999, name: "250 Story Credits" },
  pro: { credits: 600, price_cents: 1999, name: "600 Story Credits" },
};

export async function POST(req: NextRequest) {
  try {
    if (!STRIPE_SECRET) {
      return NextResponse.json({ error: "Payments not configured" }, { status: 503 });
    }

    // Auth check
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Sign in to purchase credits" }, { status: 401 });
    }

    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user } } = await client.auth.getUser(authHeader.slice(7));
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tier } = await req.json();
    const tierInfo = TIERS[tier];
    if (!tierInfo) {
      return NextResponse.json(
        { error: "Invalid tier. Options: starter, value, pro" },
        { status: 400 }
      );
    }

    // Create Stripe Checkout Session
    const stripe = await import("stripe");
    const stripeClient = new stripe.default(STRIPE_SECRET);

    const session = await stripeClient.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: tierInfo.price_cents,
            product_data: {
              name: tierInfo.name,
              description: `${tierInfo.credits} AI story credits for MakeATale`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        user_id: user.id,
        credits: String(tierInfo.credits),
        tier,
      },
      success_url: `${SITE_URL}/credits?success=true&credits=${tierInfo.credits}`,
      cancel_url: `${SITE_URL}/credits?cancelled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Purchase error:", err);
    return NextResponse.json({ error: "Payment error" }, { status: 500 });
  }
}

/** GET /api/credits/purchase — return available tiers */
export async function GET() {
  return NextResponse.json({
    tiers: Object.entries(TIERS).map(([key, tier]) => ({
      id: key,
      ...tier,
      price: `$${(tier.price_cents / 100).toFixed(2)}`,
      per_credit: `$${(tier.price_cents / 100 / tier.credits).toFixed(3)}`,
    })),
    free_daily: 5,
  });
}
