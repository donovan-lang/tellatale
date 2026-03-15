export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function getUser() {
  const cookieStore = cookies();
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(c: { name: string; value: string; options: Record<string, unknown> }[]) {
          try { c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {}
        },
      },
    }
  );
  const { data: { user } } = await authClient.auth.getUser();
  return user;
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createServiceClient();
    await supabase.from("bookmarks").delete().eq("id", params.id).eq("user_id", user.id);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
