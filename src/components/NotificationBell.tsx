"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { getSupabase } from "@/lib/supabase-browser";
import { formatDistanceToNow } from "date-fns";
import type { Notification } from "@/types";

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  async function getHeaders(): Promise<Record<string, string>> {
    const sb = getSupabase();
    const { data } = await sb.auth.getSession();
    return data.session?.access_token
      ? { Authorization: `Bearer ${data.session.access_token}` }
      : {};
  }

  async function load() {
    if (!user) return;
    const headers = await getHeaders();
    const res = await fetch("/api/notifications", { headers });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        setNotifications(data);
        setUnread(data.filter((n: Notification) => !n.is_read).length);
      }
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [user]);

  async function markAllRead() {
    const headers = await getHeaders();
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ ids: "all" }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnread(0);
  }

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(!open); if (!open && unread > 0) markAllRead(); }}
        className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-all duration-200 relative"
      >
        <Bell size={16} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold flex items-center justify-center text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-gray-900 border border-gray-700 rounded-xl shadow-2xl shadow-black/40 z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <span className="text-sm font-semibold">Notifications</span>
            <button onClick={() => setOpen(false)} className="p-1 text-gray-500 hover:text-white"><X size={14} /></button>
          </div>
          {notifications.length > 0 ? (
            <div className="divide-y divide-gray-800/50">
              {notifications.slice(0, 20).map((n) => (
                <a
                  key={n.id}
                  href={n.link || "#"}
                  className={`block px-4 py-3 hover:bg-gray-800/50 transition-colors ${!n.is_read ? "bg-brand-500/5" : ""}`}
                >
                  <p className="text-xs font-medium text-gray-300">{n.title}</p>
                  {n.body && <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{n.body}</p>}
                  <p className="text-[9px] text-gray-600 mt-1">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-center text-xs text-gray-500 py-8">No notifications yet</p>
          )}
          {notifications.length > 0 && (
            <a href="/notifications" className="block text-center text-xs text-brand-400 py-2.5 border-t border-gray-800 hover:bg-gray-800/50">
              View all
            </a>
          )}
        </div>
      )}
    </div>
  );
}
