"use client";

import { useEffect, useRef, useState } from "react";
import { IncompleteJsonParser } from "incomplete-json-parser";
import { ChatOutput } from "@/types";

const TextArea = ({
  setIsGenerating,
  isGenerating,
  setOutputs,
  outputs,
}: {
  setIsGenerating: React.Dispatch<React.SetStateAction<boolean>>;
  isGenerating: boolean;
  setOutputs: React.Dispatch<React.SetStateAction<ChatOutput[]>>;
  outputs: ChatOutput[];
}) => {
  const parser = new IncompleteJsonParser();

  const [text, setText] = useState("");
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(text);
    setText("");
  }

  const sendMessage = async (text: string) => {
    const newOutputs = [
      ...outputs,
      {
        question: text,
        steps: [],
        result: {
          answer: "",
          tools_used: [],
        },
      },
    ];

    setOutputs(newOutputs);
    setIsGenerating(true);

    try {
      const res = await fetch(`http://localhost:8000/invoke?content=${text}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(text),
      });

      if (!res.ok) {
        throw new Error("Error");
      }

      const data = res.body;
      if (!data) {
        setIsGenerating(false);
        return;
      }

      const reader = data.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let answer = { answer: "", tools_used: [] };
      let currentSteps: { name: string; result: Record<string, string> }[] = [];
      let buffer = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        let chunkValue = decoder.decode(value);
        if (!chunkValue) continue;

        buffer += chunkValue;

        if (buffer.includes("</step_name>")) {
          const stepNameMatch = buffer.match(/<step_name>([^<]*)<\/step_name>/);
          if (stepNameMatch) {
            const [_, stepName] = stepNameMatch;
            try {
              if (stepName !== "final_answer") {
                const fullStepPattern =
                  /<step><step_name>([^<]*)<\/step_name>([^<]*?)(?=<step>|<\/step>|$)/g;
                const matches = [...buffer.matchAll(fullStepPattern)];

                for (const match of matches) {
                  const [fullMatch, matchStepName, jsonStr] = match;
                  if (jsonStr) {
                    try {
                      const result = JSON.parse(jsonStr);
                      currentSteps.push({ name: matchStepName, result });
                      buffer = buffer.replace(fullMatch, "");
                    } catch (error) {}
                  }
                }
              } else {
                const jsonMatch = buffer.match(
                  /(?<=<step><step_name>final_answer<\/step_name>)(.*)/
                );
                if (jsonMatch) {
                  const [_, jsonStr] = jsonMatch;
                  parser.write(jsonStr);
                  const result = parser.getObjects();
                  answer = result;
                  parser.reset();
                }
              }
            } catch (e) {
              console.log("Failed to parse step:", e);
            }
          }
        }

        setOutputs((prevState) => {
          const lastOutput = prevState[prevState.length - 1];
          return [
            ...prevState.slice(0, -1),
            {
              ...lastOutput,
              steps: currentSteps,
              result: answer,
            },
          ];
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  function submitOnEnter(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.code === "Enter" && !e.shiftKey) {
      submit(e);
    }
  }

  const adjustHeight = () => {
    const textArea = textAreaRef.current;
    if (textArea) {
      textArea.style.height = "auto";
      textArea.style.height = `${textArea.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [text]);

  useEffect(() => {
    const handleResize = () => adjustHeight();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <form
      onSubmit={submit}
      className={`flex gap-3 z-10 ${
        outputs.length > 0 ? "fixed bottom-0 left-0 right-0 container pb-6" : ""
      }`}
    >
      <div className="w-full flex items-center bg-surface/80 backdrop-blur-md rounded-2xl border border-border focus-within:border-signal/60 transition-colors shadow-[0_0_0_1px_rgba(0,0,0,0)] focus-within:shadow-[0_0_24px_-4px_rgba(227,165,72,0.25)]">
        <textarea
          ref={textAreaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => submitOnEnter(e)}
          rows={1}
          className="w-full p-4 bg-transparent min-h-20 focus:outline-none resize-none font-sans text-foreground placeholder:text-muted"
          placeholder="Ask a question..."
        />

        <button
          type="submit"
          disabled={isGenerating || !text}
          className="disabled:bg-surface-hover disabled:text-muted bg-signal text-background transition-all w-10 h-10 rounded-full shrink-0 flex items-center justify-center mr-2 hover:scale-105 hover:shadow-[0_0_16px_-2px_rgba(227,165,72,0.6)]"
        >
          <ArrowIcon />
        </button>
      </div>
    </form>
  );
};

const ArrowIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

export default TextArea;