import MarkdownRenderer from "@/components/MarkdownRenderer";
import { Step, type ChatOutput } from "@/types";
import { useEffect, useState } from "react";

const Output = ({ output }: { output: ChatOutput }) => {
  const detailsHidden = !!output.result?.answer;
  return (
    <div className="border-t border-border py-10 first-of-type:pt-0 first-of-type:border-t-0 animate-fade-up">
      <p className="font-display text-3xl text-foreground">{output.question}</p>

      {output.steps.length > 0 && (
        <GenerationSteps steps={output.steps} done={detailsHidden} />
      )}

      <div
        className="mt-5 prose dark:prose-invert min-w-full prose-pre:whitespace-pre-wrap prose-headings:font-display prose-a:text-signal"
        style={{
          overflowWrap: "anywhere",
        }}
      >
        <MarkdownRenderer content={output.result?.answer || ""} />
      </div>

      {output.result?.tools_used?.length > 0 && (
        <div className="flex items-baseline mt-5 gap-1.5">
          <p className="text-xs font-mono text-muted">tools_used:</p>

          <div className="flex flex-wrap items-center gap-1.5">
            {output.result.tools_used.map((tool, i) => (
              <p
                key={i}
                className="text-xs font-mono px-2 py-0.5 bg-surface border border-border rounded text-thinking"
              >
                {tool}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const GenerationSteps = ({ steps, done }: { steps: Step[]; done: boolean }) => {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (done) setHidden(true);
  }, [done]);

  return (
    <div className="border border-border bg-surface/40 rounded-xl mt-5 p-4 flex flex-col">
      <button
        className="w-full text-left flex items-center justify-between font-mono text-xs uppercase tracking-widest text-muted"
        onClick={() => setHidden(!hidden)}
      >
        <span className="flex items-center gap-2">
          <span
            className={`inline-block w-1.5 h-1.5 rounded-full ${
              !done ? "bg-thinking animate-glow" : "bg-signal"
            }`}
          />
          {done ? "signal resolved" : "thinking"}
        </span>
        {hidden ? <ChevronDown /> : <ChevronUp />}
      </button>

      {!hidden && (
        <div className="flex gap-3 mt-4">
          <div className="pt-1.5 flex flex-col items-center shrink-0">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                !done ? "animate-glow bg-thinking" : "bg-signal"
              }`}
            ></span>

            <div className="w-[1px] grow border-l border-dashed border-border"></div>
          </div>

          <div className="space-y-3 font-mono text-sm">
            {steps.map((step, j) => {
              return (
                <div key={j}>
                  <p className="text-foreground">{step.name}</p>

                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    {Object.entries(step.result).map(([key, value]) => {
                      return (
                        <p
                          key={key}
                          className="text-xs px-1.5 py-0.5 bg-surface border border-border rounded text-muted"
                        >
                          {key}: {value}
                        </p>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const ChevronDown = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const ChevronUp = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m18 15-6-6-6 6" />
  </svg>
);

export default Output;