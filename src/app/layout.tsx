import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import NavBar from "@/components/NavBar";
import MobileNav from "@/components/MobileNav";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = {
  metadataBase: new URL("https://makeatale.com"),
  title: "MakeATale — AI-Powered Collaborative Storytelling",
  description:
    "Generate story seeds with AI or write your own. The community branches them into choose-your-own-adventure trees. Collaborative fiction where humans and AI build stories together.",
  keywords: [
    "AI storytelling",
    "story generator",
    "collaborative fiction",
    "choose your own adventure",
    "creative writing",
    "AI writing",
    "community stories",
    "branching narratives",
  ],
  manifest: "/manifest.json",
  themeColor: "#d946ef",
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "MakeATale — AI-Powered Collaborative Storytelling",
    description: "Generate story seeds with AI or write your own. The community branches them into choose-your-own-adventure trees.",
    images: [{ url: "/og-default.png", width: 1200, height: 630 }],
    siteName: "MakeATale",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MakeATale — AI-Powered Collaborative Storytelling",
    description: "Generate story seeds with AI or write your own. The community grows them.",
    images: ["/og-default.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-6Z9LLWCZQM" />
        <script dangerouslySetInnerHTML={{ __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-6Z9LLWCZQM');
        ` }} />
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var t = localStorage.getItem('theme');
            if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
              document.documentElement.classList.add('dark');
            }
          })();
        ` }} />
      </head>
      <body className="min-h-screen">
        <AuthProvider>
          <ThemeProvider>
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebSite", name: "MakeATale", url: "https://makeatale.com", description: "AI-powered collaborative choose-your-own-adventure fiction" }) }} />
          <ToastProvider>
          <NavBar />
          {children}

          {/* Footer */}
          <footer className="border-t border-amber-200/60 dark:border-gray-800/60 mt-20 bg-amber-50/50 dark:bg-transparent">
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
                    Where stories grow. AI-powered,
                    community-driven collaborative fiction.
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
                    <a href="/stories" className="block hover:text-gray-300">
                      Browse Stories
                    </a>
                    <a href="/submit" className="block hover:text-gray-300">
                      Generate a Tale
                    </a>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-3">Developers</h4>
                  <div className="space-y-2 text-sm text-gray-500">
                    <a href="/developers" className="block hover:text-gray-300">
                      API Docs
                    </a>
                    <a href="/llms.txt" className="block hover:text-gray-300">
                      llms.txt
                    </a>
                    <a href="/api/openapi" className="block hover:text-gray-300">
                      OpenAPI Spec
                    </a>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-3">Legal</h4>
                  <div className="space-y-2 text-sm text-gray-500">
                    <a href="/privacy" className="block hover:text-gray-300">
                      Privacy
                    </a>
                    <a href="/terms" className="block hover:text-gray-300">
                      Terms
                    </a>
                    <a href="/terms" className="block hover:text-gray-300">
                      Content Policy
                    </a>
                  </div>
                </div>
              </div>
              <div className="mt-10 pt-6 border-t border-gray-800/60 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-600">
                <p>2026 MakeATale. Built by indie.io</p>
                <p>Powered by AI. Driven by community.</p>
              </div>
            </div>
          </footer>
          <MobileNav />
        </ToastProvider>
        </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
