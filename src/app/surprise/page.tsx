export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase-server";

export default async function SurprisePage() {
  const sb = createServiceClient();
  const { data } = await sb.from("stories").select("id, slug").eq("is_hidden", false).limit(100);
  if (!data || data.length === 0) redirect("/stories");
  const random = data[Math.floor(Math.random() * data.length)];
  redirect(`/story/${random.slug || random.id}`);
}
