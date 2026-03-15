"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { getSupabase } from "@/lib/supabase-browser";
import { Bell, Loader2, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Notification } from "@/types";

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  async function getHeaders(): Promise<Record<string, string>> {
    const sb = getSupabase();
    const { data } = await sb.auth.getSession();
    return data.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : {};
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    getHeaders().then((h) =>
      fetch("/api/notifications", { headers: h })
        .then((r) => r.json())
        .then((d) => { if (Array.isArray(d)) setNotifications(d); })
        .catch(() => {})
        .finally(() => setLoading(false))
    );
  }, [user, authLoading]);

  async function markAllRead() {
    const headers = await getHeaders();
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ ids: "all" }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  if (authLoading || loading) {
    return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-gray-500" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Bell size={24} className="text-brand-400" /> Notifications
        </h1>
        {notifications.some((n) => !n.is_read) && (
          <button onClick={markAllRead} className="btn-ghost text-xs flex items-center gap-1.5">
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      {notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((n) => (
            <a
              key={n.id}
              href={n.link || "#"}
              className={`card p-4 flex items-start gap-3 ${!n.is_read ? "border-brand-500/30 bg-brand-500/5" : ""}`}
            >
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.is_read ? "bg-brand-400" : "bg-gray-700"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{n.title}</p>
                {n.body && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>}
                <p className="text-[10px] text-gray-600 mt-1">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                </p>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <Bell size={32} className="mx-auto text-gray-700 mb-3" />
          <p className="text-gray-500">No notifications yet.</p>
        </div>
      )}
    </div>
  );
}
