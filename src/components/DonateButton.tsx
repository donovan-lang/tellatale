"use client";

import { useState } from "react";
import { Heart } from "lucide-react";

const AMOUNTS = [0.5, 1, 5];

export default function DonateButton({ storyId }: { storyId: string }) {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  async function handleDonate(amountUsdc: number) {
    if (sending) return;

    // Check for Phantom/Solflare wallet
    const provider = (window as any)?.phantom?.solana || (window as any)?.solflare;
    if (!provider) {
      alert("Install Phantom or Solflare wallet to donate!");
      return;
    }

    setSending(true);
    try {
      // Connect wallet if needed
      if (!provider.isConnected) {
        await provider.connect();
      }

      // Get transaction from our API
      const res = await fetch(`/api/stories/${storyId}/donate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: provider.publicKey.toString(),
          amount: amountUsdc,
          token: "USDC",
        }),
      });

      if (!res.ok) throw new Error("Failed to build transaction");

      const { transaction } = await res.json();

      // Deserialize and sign
      const { Transaction } = await import("@solana/web3.js");
      const tx = Transaction.from(Buffer.from(transaction, "base64"));
      const signed = await provider.signTransaction(tx);

      // Send
      const { Connection } = await import("@solana/web3.js");
      const connection = new Connection(
        process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.mainnet-beta.solana.com"
      );
      const sig = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(sig, "confirmed");

      setDone(true);
      setTimeout(() => {
        setDone(false);
        setOpen(false);
      }, 2000);
    } catch (err) {
      console.error("Donation failed:", err);
      alert("Donation failed — check wallet and try again.");
    }
    setSending(false);
  }

  if (done) {
    return (
      <span className="text-brand-400 text-xs flex items-center gap-1">
        <Heart size={12} fill="currentColor" /> Thanks!
      </span>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-gray-500 hover:text-brand-400 transition-colors"
      >
        <Heart size={12} />
        <span>Tip</span>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-2 flex gap-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2 shadow-xl z-10">
          {AMOUNTS.map((amt) => (
            <button
              key={amt}
              onClick={() => handleDonate(amt)}
              disabled={sending}
              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-brand-600 hover:text-white rounded transition-colors disabled:opacity-50"
            >
              ${amt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
