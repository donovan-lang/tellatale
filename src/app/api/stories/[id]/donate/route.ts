import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { buildUsdcTransfer, buildSolTransfer } from "@/lib/solana";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { wallet, amount, token } = await req.json();

    if (!wallet || !amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const senderPubkey = new PublicKey(wallet);
    let tx;

    if (token === "SOL") {
      tx = await buildSolTransfer(senderPubkey, amount);
    } else {
      tx = await buildUsdcTransfer(senderPubkey, amount);
    }

    const serialized = tx
      .serialize({ requireAllSignatures: false })
      .toString("base64");

    return NextResponse.json({ transaction: serialized });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
