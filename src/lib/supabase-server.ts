import { supabaseServerUrl } from "@/lib/supabase-url";
import { createClient } from "@supabase/supabase-js";

export function createServiceClient() {
  return createClient(
    supabaseServerUrl(),
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      global: {
        fetch: (url: RequestInfo | URL, init?: RequestInit) =>
          fetch(url, { ...init, cache: "no-store" }),
      },
    }
  );
}
