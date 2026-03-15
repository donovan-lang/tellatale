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
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options: Record<string, unknown>;
          }[]
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
  const {
    data: { user },
  } = await authClient.auth.getUser();
  return user;
}

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("chronicles")
      .select("*, root_story:stories!chronicles_root_story_id_fkey(*)")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err: any) {
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { root_story_id, title, story_path } = await req.json();

    if (!root_story_id || !title?.trim()) {
      return NextResponse.json(
        { error: "root_story_id and title required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("chronicles")
      .insert({
        user_id: user.id,
        root_story_id,
        title: title.trim().slice(0, 200),
        story_path: story_path || [root_story_id],
      })
      .select("id")
      .single();

    if (error) throw error;
    return NextResponse.json({ id: data.id }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
