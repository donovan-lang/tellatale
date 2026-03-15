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

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("chronicles")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Chronicle not found" },
        { status: 404 }
      );
    }

    // Fetch all stories in the path
    const { data: stories } = await supabase
      .from("stories")
      .select("*")
      .in("id", data.story_path);

    // Order them by the path order
    const orderedStories = data.story_path
      .map((id: string) => stories?.find((s: any) => s.id === id))
      .filter(Boolean);

    return NextResponse.json({ ...data, stories: orderedStories });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { story_id } = await req.json();
    if (!story_id) {
      return NextResponse.json(
        { error: "story_id required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Fetch current chronicle
    const { data: chronicle } = await supabase
      .from("chronicles")
      .select("story_path, user_id")
      .eq("id", params.id)
      .single();

    if (!chronicle || chronicle.user_id !== user.id) {
      return NextResponse.json(
        { error: "Chronicle not found" },
        { status: 404 }
      );
    }

    const newPath = [...chronicle.story_path, story_id];

    const { error } = await supabase
      .from("chronicles")
      .update({ story_path: newPath, updated_at: new Date().toISOString() })
      .eq("id", params.id);

    if (error) throw error;
    return NextResponse.json({ story_path: newPath });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();
    const { error } = await supabase
      .from("chronicles")
      .delete()
      .eq("id", params.id)
      .eq("user_id", user.id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
