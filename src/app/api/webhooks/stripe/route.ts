import { NextRequest, NextResponse } from "next/server";
import { addCredits } from "@/lib/credits";
import { createServiceClient } from "@/lib/supabase-server";

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  if (!STRIPE_SECRET || !STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  try {
    const stripe = await import("stripe");
    const stripeClient = new stripe.default(STRIPE_SECRET);

    const event = stripeClient.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as any;
      const userId = session.metadata?.user_id;
      const credits = parseInt(session.metadata?.credits || "0", 10);
      const sessionId = session.id;

      if (!userId || !credits) {
        console.error("Stripe webhook: missing metadata", { userId, credits });
        return NextResponse.json({ error: "Bad metadata" }, { status: 400 });
      }

      // Idempotency check
      const sb = createServiceClient();
      const { data: existing } = await sb
        .from("credit_transactions")
        .select("id")
        .eq("stripe_session_id", sessionId)
        .single();

      if (existing) {
        return NextResponse.json({ status: "already_processed" });
      }

      // Add credits
      const newBalance = await addCredits(userId, credits, sessionId);

      console.log(`Credits added: user=${userId} credits=${credits} balance=${newBalance}`);

      return NextResponse.json({
        status: "credits_added",
        credits_added: credits,
        new_balance: newBalance,
      });
    }

    return NextResponse.json({ status: "ignored", type: event.type });
  } catch (err: any) {
    console.error("Stripe webhook error:", err.message);
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }
}
