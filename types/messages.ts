import type { ChartSpec } from "./charts";

export type MessageRole = "user" | "assistant";

export interface ToolCall {
  /** Anthropic's tool_use_id — stable across the call's lifecycle. */
  id: string;
  name: string;
  input: unknown;
  /** Short human-readable summary of the result, e.g. "14 trials, 0 specs". */
  summary?: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  charts?: ChartSpec[];
  toolCalls?: ToolCall[];
  /** Live status while the agent is working (e.g. "Fetching trial data..."). */
  status?: string | null;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

/** Wire format sent to the API — strips UI-only fields. */
export interface ApiMessage {
  role: MessageRole;
  content: string;
}

/** SSE event protocol. The chat route emits these; the client consumes them. */
export type AgentEvent =
  | { type: "status"; text: string }
  | { type: "tool_call"; call: ToolCall }
  | { type: "chart"; spec: ChartSpec }
  | { type: "text"; text: string }
  | { type: "done" }
  | { type: "error"; text: string };
