"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  Users,
  Flag,
  BarChart3,
  ChevronRight,
  Loader2,
  Lock,
  EyeOff,
  ShieldAlert,
  ThumbsUp,
  LogOut,
} from "lucide-react";

interface Stats {
  total_stories: number;
  hidden_stories: number;
  total_users: number;
  banned_users: number;
  pending_reports: number;
  total_votes: number;
}

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => {
        if (r.ok) { setAuthed(true); return r.json(); }
        setAuthed(false);
        return null;
      })
      .then((d) => { if (d) setStats(d); });
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (res.ok) {
      window.location.reload();
    } else {
      setLoginError("Invalid credentials");
    }
  }

  async function handleLogout() {
    document.cookie = "admin_token=; path=/; max-age=0";
    window.location.reload();
  }

  // Loading
  if (authed === null) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={24} className="animate-spin text-gray-500" />
      </div>
    );
  }

  // Login form
  if (!authed) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert size={24} className="text-red-400" />
            </div>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
          </div>
          {loginError && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-800 text-red-300 text-sm rounded-lg">
              {loginError}
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-red-500"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-red-500"
            />
            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-500 text-white font-medium px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Lock size={16} /> Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Dashboard
  const STAT_CARDS = [
    { label: "Total Stories", value: stats?.total_stories, icon: BookOpen, color: "text-brand-400" },
    { label: "Hidden", value: stats?.hidden_stories, icon: EyeOff, color: "text-yellow-400" },
    { label: "Users", value: stats?.total_users, icon: Users, color: "text-blue-400" },
    { label: "Banned", value: stats?.banned_users, icon: ShieldAlert, color: "text-red-400" },
    { label: "Pending Reports", value: stats?.pending_reports, icon: Flag, color: "text-orange-400" },
    { label: "Total Votes", value: stats?.total_votes, icon: ThumbsUp, color: "text-green-400" },
  ];

  const NAV = [
    { href: "/admin/stories", label: "Manage Stories", icon: BookOpen },
    { href: "/admin/reports", label: "Report Queue", icon: Flag },
    { href: "/admin/users", label: "User Management", icon: Users },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <ShieldAlert size={24} className="text-red-400" />
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        </div>
        <button onClick={handleLogout} className="btn-ghost text-sm flex items-center gap-1.5 text-gray-500 hover:text-red-400">
          <LogOut size={14} /> Logout
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {STAT_CARDS.map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <s.icon size={20} className={`mx-auto mb-2 ${s.color}`} />
            <p className="text-2xl font-bold">{s.value ?? "—"}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="space-y-3">
        {NAV.map((n) => (
          <a
            key={n.href}
            href={n.href}
            className="card flex items-center gap-4 hover:border-red-500/30 p-4"
          >
            <n.icon size={20} className="text-gray-400" />
            <span className="font-medium flex-1">{n.label}</span>
            <ChevronRight size={16} className="text-gray-600" />
          </a>
        ))}
      </div>
    </div>
  );
}
