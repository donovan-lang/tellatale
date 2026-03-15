import { NextRequest, NextResponse } from "next/server";
import { signAdminToken } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  if (username === "admin" && password === "admin") {
    const token = signAdminToken();
    const res = NextResponse.json({ ok: true });
    res.cookies.set("admin_token", token, {
      path: "/",
      maxAge: 86400,
      sameSite: "lax",
    });
    return res;
  }
  return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
}
