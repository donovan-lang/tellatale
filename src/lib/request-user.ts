import { createClient, type User } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";

/**
 * The signed-in user for an API route request, or null.
 * The browser client keeps the session in localStorage, so client fetches send it as a
 * Bearer token (see authJsonHeaders). Cookies are checked as a fallback for OAuth callbacks.
 */
export async function getRequestUser(): Promise<User | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  try {
    const authHeader = headers().get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const { data: { user } } = await createClient(url, anonKey).auth.getUser(authHeader.slice(7));
      if (user) return user;
    }
  } catch {}

  try {
    const cookieStore = cookies();
    const authClient = createServerClient(url, anonKey, {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(c: { name: string; value: string; options: Record<string, unknown> }[]) {
          try { c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {}
        },
      },
    });
    const { data: { user } } = await authClient.auth.getUser();
    return user;
  } catch {
    return null;
  }
}
