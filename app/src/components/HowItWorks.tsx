"use client";

import { useEffect } from "react";

const steps = [
  {
    label: "01",
    title: "You ask",
    detail: "Your question travels from the browser to a FastAPI backend over a streaming connection.",
  },
  {
    label: "02",
    title: "The agent reasons",
    detail: "A GPT-4o-mini agent decides which tool it needs: math, web search, or a direct answer.",
  },
  {
    label: "03",
    title: "Tools execute",
    detail: "The chosen tool runs, and its result is fed back to the agent for the next decision.",
  },
  {
    label: "04",
    title: "Signal resolves",
    detail: "Once the agent has everything it needs, it streams the final answer back, token by token.",
  },
];

const HowItWorks = ({ onClose }: { onClose: () => void }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border rounded-2xl max-w-lg w-full p-8 animate-fade-up shadow-[0_0_60px_-15px_rgba(139,127,255,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl">How the signal travels</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground transition-colors text-lg"
          >
            X
          </button>
        </div>

        <div className="relative pl-8">
          <div className="absolute left-[7px] top-2 bottom-2 w-[1px] bg-gradient-to-b from-thinking via-signal to-transparent" />

          {steps.map((step, i) => (
            <div
              key={step.label}
              className="relative pb-7 last:pb-0 animate-fade-up"
              style={{ animationDelay: (0.15 + i * 0.12) + "s" }}
            >
              <span className="absolute -left-8 top-0.5 w-3.5 h-3.5 rounded-full bg-background border-2 border-signal" />
              <p className="font-mono text-xs text-thinking mb-1">{step.label}</p>
              <p className="font-display text-lg mb-1">{step.title}</p>
              <p className="text-sm text-muted leading-relaxed">{step.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-5 border-t border-border flex items-center justify-between text-xs font-mono text-muted">
          <span>built with LangChain and FastAPI and Next.js</span>
          <a href="#" target="_blank" className="text-signal hover:underline">
            view source
          </a>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;