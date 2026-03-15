import { createHmac } from "crypto";
import { NextRequest } from "next/server";

const SECRET = process.env.ADMIN_SECRET;
if (!SECRET) {
  console.warn("ADMIN_SECRET env var not set — admin auth will not work");
}
const SIGNING_KEY = SECRET || "fallback-dev-only-not-for-production";

export function signAdminToken(): string {
  const payload = Buffer.from(
    JSON.stringify({ role: "admin", exp: Date.now() + 86400000 })
  ).toString("base64url");
  const sig = createHmac("sha256", SIGNING_KEY).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyAdminToken(token: string): boolean {
  try {
    const [payload, sig] = token.split(".");
    if (!payload || !sig) return false;
    const expected = createHmac("sha256", SIGNING_KEY)
      .update(payload)
      .digest("base64url");
    if (sig !== expected) return false;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    return data.role === "admin" && data.exp > Date.now();
  } catch {
    return false;
  }
}

export function isAdminRequest(req: NextRequest): boolean {
  const cookie = req.cookies.get("admin_token")?.value;
  return !!cookie && verifyAdminToken(cookie);
}
