"use client";

import { useState } from "react";
import HowItWorks from "@/components/HowItWorks";

const Header = () => {
  const [showHow, setShowHow] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-20 backdrop-blur-md bg-background/60 border-b border-border/60">
        <div className="container flex items-center justify-between py-4">
          <div className="animate-fade-up">
            <p className="font-display text-lg tracking-tight">
              Mohamed Kassab
            </p>
            <div className="h-[1px] w-full bg-gradient-to-r from-signal via-thinking to-transparent brand-underline" />
          </div>

          <button
            onClick={() => setShowHow(true)}
            className="animate-fade-up text-xs font-mono uppercase tracking-widest text-muted hover:text-foreground transition-colors flex items-center gap-2 border border-border rounded-full px-3 py-1.5 hover:border-signal/50"
            style={{ animationDelay: "0.1s" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-thinking animate-glow" />
            How it works
          </button>
        </div>
      </header>

      {showHow && <HowItWorks onClose={() => setShowHow(false)} />}
    </>
  );
};

export default Header;