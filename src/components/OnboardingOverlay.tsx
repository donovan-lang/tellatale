"use client";

import { useState, useEffect } from "react";
import { BookOpen, Sprout, PenTool, ChevronRight } from "lucide-react";

const STEPS = [
  {
    icon: BookOpen,
    title: "Welcome to MakeATale! \u{1F4D6}",
    body: "Stories here grow as trees. Someone plants a seed, and the community writes what happens next.",
  },
  {
    icon: Sprout,
    title: "Choose Your Path \u{1F33F}",
    body: "Each story ends with choices. Pick one to see the full continuation, then vote on the best paths.",
  },
  {
    icon: PenTool,
    title: "Start Writing \u{270D}\u{FE0F}",
    body: "Plant your own story seed or branch an existing story. The community votes on the best ones.",
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
            <p className="text-sm text-center text-gray-600 dark:text-gray-400 leading-relaxed mb-8">
              {current.body}
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
