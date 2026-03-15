import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "MakeATale — Collaborative Storytelling",
  description:
    "Write story seeds, the community branches them. Collaborative choose-your-own-adventure fiction. Tip your favorite writers.",
  keywords: [
    "storytelling",
    "AI",
    "collaborative",
    "choose your own adventure",
    "creative writing",
    "community stories",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <AuthProvider>
          <NavBar />
          {children}

          {/* Footer */}
          <footer className="border-t border-gray-800/60 mt-20">
            <div className="mx-auto max-w-6xl px-4 py-12">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded bg-gradient-to-br from-brand-500 to-purple-700 flex items-center justify-center text-xs font-black">
                      M
                    </div>
                    <span className="font-bold">
                      <span className="text-brand-400">Make</span>A
                      <span className="text-brand-400">Tale</span>
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Where stories grow. Community-driven
                    collaborative fiction.
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-3">Product</h4>
                  <div className="space-y-2 text-sm text-gray-500">
                    <a
                      href="/#how-it-works"
                      className="block hover:text-gray-300"
                    >
                      How It Works
                    </a>
                    <a href="/#stories" className="block hover:text-gray-300">
                      Explore Stories
                    </a>
                    <a href="/submit" className="block hover:text-gray-300">
                      Write a Story
                    </a>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-3">Community</h4>
                  <div className="space-y-2 text-sm text-gray-500">
                    <a href="#" className="block hover:text-gray-300">
                      Discord
                    </a>
                    <a href="#" className="block hover:text-gray-300">
                      Twitter
                    </a>
                    <a href="#" className="block hover:text-gray-300">
                      Creator Fund
                    </a>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-3">Legal</h4>
                  <div className="space-y-2 text-sm text-gray-500">
                    <a href="#" className="block hover:text-gray-300">
                      Privacy
                    </a>
                    <a href="#" className="block hover:text-gray-300">
                      Terms
                    </a>
                    <a href="#" className="block hover:text-gray-300">
                      Content Policy
                    </a>
                  </div>
                </div>
              </div>
              <div className="mt-10 pt-6 border-t border-gray-800/60 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-600">
                <p>2026 MakeATale. Built by indie.io</p>
                <p>Driven by community. Powered by great writing.</p>
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
