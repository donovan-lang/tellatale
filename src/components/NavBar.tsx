"use client";

import { useAuth } from "@/components/AuthProvider";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X, Loader2 } from "lucide-react";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";
import NotificationBell from "./NotificationBell";

export default function NavBar() {
  const { user, loading, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const penName =
    user?.user_metadata?.pen_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Writer";

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const navLinkClass = (href: string) =>
    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive(href)
        ? "text-brand-500 dark:text-brand-400 bg-brand-500/10"
        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/50"
    }`;

  return (
    <nav className="sticky top-0 z-50 border-b border-amber-200/60 dark:border-gray-800/60 bg-amber-50/80 dark:bg-gray-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 group">
          <img
            src="/logos/icon-48.png"
            alt="MakeATale"
            width={32}
            height={32}
            className="rounded-lg shadow-lg shadow-brand-500/20 group-hover:shadow-brand-500/40 transition-shadow duration-300"
          />
          <img
            src="/logos/logo-trimmed.png"
            alt="MakeATale"
            height={28}
            className="h-7 w-auto hidden sm:block"
          />
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {user ? (
            <>
              <a href="/stories" className={navLinkClass("/stories")}>
                📚 Stories
              </a>
              <a href="/submit" className={navLinkClass("/submit")}>
                ✍️ Write
              </a>
            </>
          ) : (
            <>
              <a href="/#how-it-works" className="text-sm text-gray-400 hover:text-gray-900 dark:hover:text-white px-3 py-1.5 rounded-lg transition-colors">
                How It Works
              </a>
              <a href="/stories" className={navLinkClass("/stories")}>
                📚 Stories
              </a>
              <a href="/submit" className={navLinkClass("/submit")}>
                ✍️ Write
              </a>
            </>
          )}
        </div>

        {/* Desktop auth area */}
        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          {user && <NotificationBell />}
          {loading ? (
            <div className="px-4 py-2">
              <Loader2 size={16} className="animate-spin text-gray-500" />
            </div>
          ) : user ? (
            <div className="flex items-center gap-1">
              <a
                href="/account"
                className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-all duration-200 ${
                  isActive("/account")
                    ? "text-brand-400 bg-brand-500/10"
                    : "text-brand-400 hover:text-brand-300 hover:bg-brand-500/10"
                }`}
              >
                {penName}
              </a>
              <button
                onClick={signOut}
                className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200"
                title="Sign out"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <a href="/login" className="btn-ghost text-sm">Log In</a>
              <a href="/signup" className="bg-brand-600 text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-brand-500 transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-brand-500/20">
                Sign Up Free
              </a>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-amber-200/60 dark:border-gray-800/60 px-4 py-4 space-y-1 bg-amber-50/98 dark:bg-gray-950/98 backdrop-blur-xl">
          {user ? (
            <>
              <a href="/stories" className={navLinkClass("/stories") + " w-full"}>📚 Stories</a>
              <a href="/submit" className={navLinkClass("/submit") + " w-full"}>✍️ Write</a>
            </>
          ) : (
            <>
              <a href="/#how-it-works" className="block text-sm text-gray-400 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-lg">How It Works</a>
              <a href="/stories" className={navLinkClass("/stories") + " w-full"}>📚 Stories</a>
              <a href="/submit" className={navLinkClass("/submit") + " w-full"}>✍️ Write</a>
            </>
          )}
          <div className="pt-3 mt-2 border-t border-gray-200/60 dark:border-gray-800/60">
            {loading ? (
              <Loader2 size={16} className="animate-spin text-gray-500 ml-3" />
            ) : user ? (
              <div className="space-y-1">
                <a href="/account" className={navLinkClass("/account") + " w-full"}>{penName}</a>
                <button onClick={signOut} className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-400 px-3 py-2 rounded-lg w-full transition-colors">
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <a href="/login" className="btn-ghost text-sm flex-1 text-center">Log In</a>
                <a href="/signup" className="bg-brand-600 text-white font-semibold px-4 py-2 rounded-lg text-sm flex-1 text-center hover:bg-brand-500">Sign Up Free</a>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
