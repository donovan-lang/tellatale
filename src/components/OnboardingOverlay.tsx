"use client";

import { useState, useEffect } from "react";
import { Sparkles, GitFork, ThumbsUp, PenTool, ChevronRight } from "lucide-react";

const STEPS = [
  {
    icon: Sparkles,
    title: "Generate or write stories",
    body: "Describe an idea and AI generates a full story for you. Or write your own from scratch. Either way, your story becomes a seed that the community can grow.",
    tip: "Try it: go to Write and switch to the \"Generate with AI\" tab.",
  },
  {
    icon: GitFork,
    title: "Stories branch into trees",
    body: "Every story ends at a decision point. Readers write what happens next — each choice creates a new branch. One seed becomes dozens of unique paths.",
    tip: "When reading, scroll down to \"What happens next?\" to see choices or add your own.",
  },
  {
    icon: ThumbsUp,
    title: "Vote and the best paths rise",
    body: "Upvote branches you love. The community decides which paths are the most compelling. Bad branches fade, great ones rise to the top.",
    tip: "Use the arrows on any story or branch to vote.",
  },
  {
    icon: PenTool,
    title: "AI helps you write better",
    body: "When writing, the AI Writing Assist panel offers tools to polish your prose, suggest next sentences, fix grammar, and more. Hover over each tool to learn what it does.",
    tip: "These tools appear below the text area when you're writing.",
  },
];

export default function OnboardingOverlay() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("mat_onboarded")) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  function dismiss() {
    localStorage.setItem("mat_onboarded", "1");
    setVisible(false);
  }

  function next() {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      dismiss();
    }
  }

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4">
        {/* Gradient border wrapper */}
        <div className="p-[2px] rounded-2xl bg-gradient-to-br from-brand-500 via-purple-500 to-brand-600">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8">
            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === step
                      ? "w-8 bg-brand-500"
                      : i < step
                      ? "w-4 bg-brand-500/40"
                      : "w-4 bg-gray-300 dark:bg-gray-700"
                  }`}
                />
              ))}
            </div>

            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-5">
              <Icon size={28} className="text-brand-500" />
            </div>

            {/* Content */}
            <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-3">
              {current.title}
            </h2>
            <p className="text-sm text-center text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
              {current.body}
            </p>
            <p className="text-xs text-center text-brand-500 dark:text-brand-400 bg-brand-500/5 rounded-lg px-3 py-2 mb-6">
              {current.tip}
            </p>

            {/* Step counter */}
            <p className="text-[10px] text-center text-gray-400 mb-4">
              {step + 1} of {STEPS.length}
            </p>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={dismiss}
                className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                Skip
              </button>
              <button
                onClick={next}
                className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-brand-500/20 hover:shadow-brand-500/40"
              >
                {isLast ? "Get Started" : "Next"}
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
