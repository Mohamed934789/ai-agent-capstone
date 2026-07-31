"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Output from "@/components/Output";
import TextArea from "@/components/TextArea";
import { type ChatOutput } from "@/types";
import { useState } from "react";

export default function Home() {
  const [outputs, setOutputs] = useState<ChatOutput[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  return (
    <>
      <Header />

      <div
        className={`container pt-28 pb-32 min-h-screen ${
          outputs.length === 0 && "flex items-center justify-center"
        }`}
      >
        <div className="w-full">
          {outputs.length === 0 && (
            <div className="text-center mb-8">
              <div
                className="inline-flex items-center gap-2 mb-5 px-3 py-1 rounded-full border border-border bg-surface/60 text-xs font-mono text-thinking tracking-wide animate-fade-up"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-thinking animate-glow" />
                signal · idle
              </div>
              <h1
                className="font-display text-5xl md:text-6xl leading-tight bg-gradient-to-br from-foreground via-foreground to-muted bg-clip-text text-transparent animate-fade-up"
                style={{ animationDelay: "0.1s" }}
              >
                What do you want
                <br />
                to know?
              </h1>
              <p
                className="mt-4 text-muted text-sm animate-fade-up"
                style={{ animationDelay: "0.2s" }}
              >
                Ask anything — I'll think out loud while I work it out.
              </p>
            </div>
          )}

          <TextArea
            setIsGenerating={setIsGenerating}
            isGenerating={isGenerating}
            outputs={outputs}
            setOutputs={setOutputs}
          />

          {outputs.map((output, i) => {
            return <Output key={i} output={output} />;
          })}
        </div>
      </div>

      {outputs.length === 0 && <Footer />}
    </>
  );
}