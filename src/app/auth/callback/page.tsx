"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getSupabase } from "@/lib/supabase-browser";
import { safeRedirectPath } from "@/lib/safe-redirect";

/**
 * Landing page for Supabase email links (signup confirmation, password reset).
 * The browser client uses the implicit flow, so tokens arrive in the URL #hash,
 * which only the browser can read — this has to be a client page, not a route handler.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Read the URL before the Supabase client consumes and clears the #hash
    const url = new URL(window.location.href);
    const hash = new URLSearchParams(url.hash.slice(1));
    const next = safeRedirectPath(url.searchParams.get("next"));
    const isRecovery = hash.get("type") === "recovery" || next === "/reset-password";
    const linkError = hash.get("error_description") || url.searchParams.get("error_description");

    if (linkError) {
      setError(linkError.replace(/\+/g, " "));
      return;
    }

    (async () => {
      const supabase = getSupabase();
      const code = url.searchParams.get("code");
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setError(exchangeError.message);
          return;
        }
      }
      // getSession waits for the client to finish picking up tokens from the #hash
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setError("This link is invalid or has expired.");
        return;
      }
      router.replace(isRecovery ? "/reset-password" : next);
    })();
  }, [router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      {error ? (
        <div className="w-full max-w-md text-center space-y-4">
          <div className="p-4 rounded-lg bg-red-900/30 border border-red-800 text-red-300 text-sm">
            {error}
          </div>
          <p className="text-sm text-gray-500">
            Links expire after a while and only work once.{" "}
            <a href="/login" className="text-brand-400 hover:text-brand-300">Back to sign in</a>
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 size={20} className="animate-spin" />
          Signing you in...
        </div>
      )}
    </div>
  );
}
