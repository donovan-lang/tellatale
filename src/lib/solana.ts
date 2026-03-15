import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
} from "@solana/spl-token";

const RPC = process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.mainnet-beta.solana.com";
const DONATION_WALLET = new PublicKey(
  process.env.NEXT_PUBLIC_DONATION_WALLET || "KWgxeAjeiPsQD3kMezbiEuMDzdagAW83bbTLSuL1xQH"
);
const USDC_MINT = new PublicKey(
  process.env.NEXT_PUBLIC_USDC_MINT || "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
);

export function getConnection() {
  return new Connection(RPC, "confirmed");
}

export async function buildUsdcTransfer(
  senderPubkey: PublicKey,
  amountUsdc: number
): Promise<Transaction> {
  const connection = getConnection();
  const senderAta = await getAssociatedTokenAddress(USDC_MINT, senderPubkey);
  const recipientAta = await getAssociatedTokenAddress(USDC_MINT, DONATION_WALLET);

  // USDC has 6 decimals
  const amountRaw = Math.round(amountUsdc * 1_000_000);

  const tx = new Transaction().add(
    createTransferInstruction(senderAta, recipientAta, senderPubkey, amountRaw)
  );

  tx.feePayer = senderPubkey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  return tx;
}

export async function buildSolTransfer(
  senderPubkey: PublicKey,
  amountSol: number
): Promise<Transaction> {
  const connection = getConnection();
  const lamports = Math.round(amountSol * LAMPORTS_PER_SOL);

  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: senderPubkey,
      toPubkey: DONATION_WALLET,
      lamports,
    })
  );

  tx.feePayer = senderPubkey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  return tx;
}

export { DONATION_WALLET, USDC_MINT };
