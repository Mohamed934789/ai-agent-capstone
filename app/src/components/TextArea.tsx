"use client";
import { useEffect, useRef, useState } from "react";
import { IncompleteJsonParser } from "incomplete-json-parser";
import type { AgentEvent, ChatOutput } from "@/types";

export default function TextArea({ setIsGenerating, isGenerating, setOutputs }: {
  setIsGenerating: React.Dispatch<React.SetStateAction<boolean>>;
  isGenerating: boolean;
  setOutputs: React.Dispatch<React.SetStateAction<ChatOutput[]>>;
  outputs: ChatOutput[];
}) {
  const [text, setText] = useState("");
  const abort = useRef<AbortController | null>(null);
  useEffect(() => () => abort.current?.abort(), []);
  const update = (fn: (last: ChatOutput) => ChatOutput) => setOutputs(prev => prev.length ? [...prev.slice(0, -1), fn(prev[prev.length - 1])] : prev);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (isGenerating || !text.trim()) return;
    const question = text.trim(); setText(""); setIsGenerating(true);
    setOutputs(prev => [...prev, { question, steps: [], result: { answer: "", tools_used: [] } }]);
    const controller = new AbortController(); abort.current = controller;
    let tool = "", args = "";
    const receive = (event: AgentEvent) => {
      if (event.type === "tool_start") { tool = event.name; args = ""; }
      if (event.type === "tool_arguments" && tool === "final_answer") {
        args += event.text;
        try {
          const parser = new IncompleteJsonParser(); parser.write(args);
          const partial = parser.getObjects() as { answer?: string };
          if (typeof partial.answer === "string") update(last => ({ ...last, result: { ...last.result, answer: partial.answer ?? "" } }));
        } catch { /* Partial JSON may end mid-token; the result event is authoritative. */ }
      }
      if (event.type === "tool_result") update(last => ({ ...last, steps: [...last.steps, { name: event.name, result: { output: JSON.stringify(event.result) } }] }));
      if (event.type === "result") update(last => ({ ...last, result: { answer: event.answer, tools_used: event.tools_used } }));
      if (event.type === "error") update(last => ({ ...last, result: { ...last.result, answer: event.message } }));
    };
    try {
      const origin = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${origin}/invoke`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: question }), signal: controller.signal });
      if (!res.ok || !res.body) throw new Error("Request failed");
      const reader = res.body.getReader(), decoder = new TextDecoder(); let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        let boundary: number;
        while ((boundary = buffer.indexOf("\n\n")) >= 0) {
          const frame = buffer.slice(0, boundary); buffer = buffer.slice(boundary + 2);
          const data = frame.split("\n").filter(line => line.startsWith("data: ")).map(line => line.slice(6)).join("\n");
          if (data) receive(JSON.parse(data) as AgentEvent);
        }
        if (done) break;
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) update(last => ({ ...last, result: { ...last.result, answer: "Unable to complete the request. Check the API service." } }));
    } finally { setIsGenerating(false); abort.current = null; }
  }
  return <form onSubmit={submit} className="flex gap-3 py-6">
    <textarea value={text} onChange={e => setText(e.target.value)} maxLength={4000} disabled={isGenerating} rows={3} placeholder="Ask a question…" className="w-full p-4 rounded-xl bg-surface border border-border" />
    <button type="submit" disabled={isGenerating || !text.trim()} className="px-5 rounded-xl bg-signal text-background disabled:opacity-40">{isGenerating ? "Working…" : "Ask"}</button>
    {isGenerating && <button type="button" onClick={() => abort.current?.abort()}>Stop</button>}
  </form>;
}
