import type { ChartSpec } from "./charts";

export type MessageRole = "user" | "assistant";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  charts?: ChartSpec[];
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
  | { type: "chart"; spec: ChartSpec }
  | { type: "text"; text: string }
  | { type: "done" }
  | { type: "error"; text: string };
