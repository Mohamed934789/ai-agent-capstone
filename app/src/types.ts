export type Step = { name: string; result: Record<string, string> };
export type ChatOutput = { question: string; steps: Step[]; result: { answer: string; tools_used: string[] } };
export type AgentEvent =
  | { type: "tool_start"; name: string }
  | { type: "tool_arguments"; text: string }
  | { type: "tool_result"; name: string; result: unknown }
  | { type: "result"; answer: string; tools_used: string[] }
  | { type: "error"; message: string }
  | { type: "done" };
