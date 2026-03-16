"use client";

import { usePathname } from "next/navigation";
import { BookOpen, Compass, PenTool, User } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

const TABS = [
  { href: "/stories", label: "Stories", icon: BookOpen },
  { href: "/submit", label: "Write", icon: PenTool },
  { href: "/account", label: "Profile", icon: User },
];

export default function MobileNav() {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  // Only show for logged-in users, and only on mobile
  if (loading || !user) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-amber-200/60 dark:border-gray-800/60 bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around px-2 py-1.5">
        {TABS.map((tab) => {
          const active =
            pathname === tab.href || pathname.startsWith(tab.href + "/");
          const Icon = tab.icon;
          return (
            <a
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-[56px] ${
                active
                  ? "text-brand-500 dark:text-brand-400"
                  : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
            >
              <Icon
                size={20}
                className={active ? "fill-brand-500/20 dark:fill-brand-400/20" : ""}
              />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
