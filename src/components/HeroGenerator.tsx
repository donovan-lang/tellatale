"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight } from "lucide-react";

export default function HeroGenerator() {
  const router = useRouter();
  const [idea, setIdea] = useState("");

  function go() {
    if (!idea.trim()) {
      router.push("/submit");
      return;
    }
    // Pass the idea to submit page via URL param
    router.push(`/submit?idea=${encodeURIComponent(idea.trim())}`);
  }

  return (
    <div className="animate-fade-up animate-fade-up-delay-3 mt-10 max-w-xl mx-auto">
      <div className="flex gap-2 bg-white/10 dark:bg-gray-900/60 backdrop-blur-sm border border-gray-200/30 dark:border-gray-700/40 rounded-2xl p-2 shadow-xl shadow-purple-500/10">
        <input
          type="text"
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && go()}
          placeholder="Describe a story idea..."
          className="flex-1 bg-transparent px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none"
          maxLength={200}
        />
        <button
          onClick={go}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-brand-600 hover:from-purple-500 hover:to-brand-500 transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 shrink-0 text-sm"
        >
          <Sparkles size={16} />
          Generate
        </button>
      </div>
      <div className="mt-3 flex items-center justify-center gap-4 text-xs text-gray-500">
        <button onClick={() => setIdea("A detective on Mars discovers the colony is a simulation")} className="hover:text-gray-300 transition-colors">Try: Mars detective</button>
        <span className="text-gray-700">|</span>
        <button onClick={() => setIdea("A child finds a door that leads to a world where time runs backwards")} className="hover:text-gray-300 transition-colors">Try: Time door</button>
        <span className="text-gray-700">|</span>
        <a href="/stories" className="hover:text-brand-400 transition-colors flex items-center gap-1">
          Browse stories <ArrowRight size={10} />
        </a>
      </div>
    </div>
  );
}
