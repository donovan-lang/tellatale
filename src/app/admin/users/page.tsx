"use client";

import { useEffect, useState } from "react";
import { Users, ShieldAlert, ShieldCheck, Search, ArrowLeft, Loader2 } from "lucide-react";

interface UserProfile {
  id: string;
  pen_name: string;
  slug: string | null;
  is_banned: boolean;
  ban_reason: string | null;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  function load() {
    setLoading(true);
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    fetch(`/api/admin/users${params}`)
      .then((r) => r.ok ? r.json() : [])
      .then(setUsers)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function toggleBan(user: UserProfile) {
    const action = user.is_banned ? "unban" : "ban";
    const reason = action === "ban" ? prompt("Ban reason:") : undefined;
    if (action === "ban" && !reason) return;

    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: user.id, action, reason }),
    });
    load();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <a href="/admin" className="text-gray-500 hover:text-white"><ArrowLeft size={18} /></a>
        <h1 className="text-xl font-bold">User Management</h1>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="Search by pen name..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-red-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-gray-500" /></div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className={`card p-3 flex items-center gap-3 ${u.is_banned ? "border-red-500/30 opacity-60" : ""}`}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-purple-700 flex items-center justify-center text-xs font-bold shrink-0">
                {u.pen_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {u.pen_name}
                  {u.is_banned && (
                    <span className="ml-2 text-[10px] text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded">
                      BANNED{u.ban_reason ? `: ${u.ban_reason}` : ""}
                    </span>
                  )}
                </p>
                <p className="text-[10px] text-gray-500">
                  Joined {new Date(u.created_at).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => toggleBan(u)}
                className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                  u.is_banned
                    ? "text-green-400 hover:bg-green-400/10"
                    : "text-red-400 hover:bg-red-400/10"
                }`}
              >
                {u.is_banned ? (
                  <><ShieldCheck size={14} /> Unban</>
                ) : (
                  <><ShieldAlert size={14} /> Ban</>
                )}
              </button>
            </div>
          ))}
          {users.length === 0 && <p className="text-center text-gray-500 py-10">No users found.</p>}
        </div>
      )}
    </div>
  );
}
