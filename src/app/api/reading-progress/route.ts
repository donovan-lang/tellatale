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

export async function GET(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rootId = req.nextUrl.searchParams.get("root_story_id");
    const supabase = createServiceClient();

    let query = supabase
      .from("reading_progress")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (rootId) {
      query = query.eq("root_story_id", rootId);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Enrich with story data
    const allIds = Array.from(new Set((data || []).flatMap((r: any) => [r.root_story_id, r.current_story_id])));
    if (allIds.length > 0) {
      const { data: stories } = await supabase
        .from("stories")
        .select("id, title, content, teaser, author_name, depth, tags, image_url")
        .in("id", allIds);
      const storyMap = new Map((stories || []).map((s: any) => [s.id, s]));
      const enriched = (data || []).map((r: any) => ({
        ...r,
        root_story: storyMap.get(r.root_story_id) || null,
        current_story: storyMap.get(r.current_story_id) || null,
      }));
      return NextResponse.json(enriched);
    }

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

    const { root_story_id, current_story_id } = await req.json();
    if (!root_story_id || !current_story_id) {
      return NextResponse.json(
        { error: "root_story_id and current_story_id required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("reading_progress")
      .upsert(
        {
          user_id: user.id,
          root_story_id,
          current_story_id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,root_story_id" }
      )
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
