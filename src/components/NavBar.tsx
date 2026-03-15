"use client";

import { useAuth } from "@/components/AuthProvider";
import { LogOut, Menu, X, Loader2, BookMarked } from "lucide-react";
import { useState } from "react";

export default function NavBar() {
  const { user, loading, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const penName =
    user?.user_metadata?.pen_name || user?.email?.split("@")[0] || "Writer";

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-800/60 bg-gray-950/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-purple-700 flex items-center justify-center text-sm font-black">
            M
          </div>
          <span className="text-xl font-bold tracking-tight">
            <span className="text-brand-400">Make</span>
            <span className="text-white">A</span>
            <span className="text-brand-400">Tale</span>
          </span>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6 text-sm text-gray-400">
          <a
            href="/#how-it-works"
            className="hover:text-white transition-colors"
          >
            How It Works
          </a>
          <a href="/explore" className="hover:text-white transition-colors">
            Explore
          </a>
          <a href="/submit" className="hover:text-white transition-colors">
            Write
          </a>
          {user && (
            <a
              href="/chronicles"
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <BookMarked size={14} />
              My Chronicles
            </a>
          )}
        </div>

        {/* Desktop auth area */}
        <div className="hidden md:flex items-center gap-2">
          <a href="/submit" className="btn-ghost text-sm">
            + New Story
          </a>

          {loading ? (
            <div className="px-4 py-2">
              <Loader2 size={16} className="animate-spin text-gray-500" />
            </div>
          ) : user ? (
            <div className="flex items-center gap-3">
              <a
                href="/account"
                className="text-sm text-brand-400 font-medium hover:text-brand-300 transition-colors"
              >
                {penName}
              </a>
              <button
                onClick={signOut}
                className="btn-ghost text-sm flex items-center gap-1.5 text-gray-500 hover:text-red-400"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          ) : (
            <>
              <a href="/login" className="btn-ghost text-sm">
                Log In
              </a>
              <a
                href="/signup"
                className="bg-white text-gray-950 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors"
              >
                Sign Up Free
              </a>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-gray-400 hover:text-white"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-800/60 px-4 py-4 space-y-3 bg-gray-950/95 backdrop-blur-xl">
          <a
            href="/#how-it-works"
            className="block text-sm text-gray-400 hover:text-white"
          >
            How It Works
          </a>
          <a
            href="/explore"
            className="block text-sm text-gray-400 hover:text-white"
          >
            Explore
          </a>
          <a
            href="/submit"
            className="block text-sm text-gray-400 hover:text-white"
          >
            Write
          </a>
          <a
            href="/submit"
            className="block text-sm text-gray-400 hover:text-white"
          >
            + New Story
          </a>
          {user && (
            <a
              href="/chronicles"
              className="block text-sm text-gray-400 hover:text-white"
            >
              My Chronicles
            </a>
          )}
          <div className="pt-3 border-t border-gray-800/60">
            {loading ? (
              <Loader2 size={16} className="animate-spin text-gray-500" />
            ) : user ? (
              <div className="space-y-3">
                <a
                  href="/account"
                  className="block text-sm text-brand-400 font-medium hover:text-brand-300"
                >
                  {penName}
                </a>
                <button
                  onClick={signOut}
                  className="text-sm text-gray-500 hover:text-red-400 flex items-center gap-1.5"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <a href="/login" className="btn-ghost text-sm">
                  Log In
                </a>
                <a
                  href="/signup"
                  className="bg-white text-gray-950 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                >
                  Sign Up Free
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
