import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("stories")
      .select("*")
      .is("parent_id", null)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, content, author_name, image_url, image_prompt, parent_id } =
      body;

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json(
        { error: "Title and content required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Try to get the authenticated user's session for author attribution
    let authorId: string | null = null;
    let resolvedAuthorName = (author_name || "Anonymous").slice(0, 50);

    try {
      const cookieStore = cookies();
      const authClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[]) {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
                );
              } catch {
                // Read-only in Route Handlers depending on context
              }
            },
          },
        }
      );

      const {
        data: { user },
      } = await authClient.auth.getUser();

      if (user) {
        authorId = user.id;

        // Look up profile pen_name
        const { data: profile } = await supabase
          .from("profiles")
          .select("pen_name")
          .eq("id", user.id)
          .single();

        if (profile?.pen_name) {
          resolvedAuthorName = profile.pen_name;
        }
      }
    } catch {
      // No auth session — that's fine, post anonymously
    }

    // Calculate depth from parent
    let depth = 0;
    if (parent_id) {
      const { data: parent } = await supabase
        .from("stories")
        .select("depth")
        .eq("id", parent_id)
        .single();

      if (parent) depth = parent.depth + 1;
    }

    const { data, error } = await supabase
      .from("stories")
      .insert({
        title: title.trim().slice(0, 200),
        content: content.trim().slice(0, 5000),
        author_id: authorId,
        author_name: resolvedAuthorName,
        image_url: image_url || null,
        image_prompt: image_prompt?.slice(0, 500) || null,
        parent_id: parent_id || null,
        depth,
        upvotes: 0,
        downvotes: 0,
      })
      .select("id")
      .single();

    if (error) throw error;
    return NextResponse.json({ id: data.id }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
