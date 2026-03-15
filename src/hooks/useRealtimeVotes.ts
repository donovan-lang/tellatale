"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase-browser";

export function useRealtimeVotes(storyId: string, initial: { up: number; down: number }) {
  const [votes, setVotes] = useState(initial);

  useEffect(() => {
    const supabase = getSupabase();
    const channel = supabase
      .channel(`votes-${storyId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "votes", filter: `story_id=eq.${storyId}` },
        () => {
          // On any vote change, re-fetch the actual counts from the story
          supabase
            .from("stories")
            .select("upvotes, downvotes")
            .eq("id", storyId)
            .single()
            .then(({ data }: any) => {
              if (data) setVotes({ up: data.upvotes, down: data.downvotes });
            });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [storyId]);

  return votes;
}
