"use client";

import { useCallback, useState } from "react";
import { MessageList } from "./MessageList";
import { InputBar } from "./InputBar";
import { WelcomeScreen } from "./WelcomeScreen";
import { ChatHeader } from "./ChatHeader";
import { readAgentStream } from "@/lib/sse";
import type { Message, ApiMessage, ToolCall } from "@/types/messages";
import type { ChartSpec } from "@/types/charts";
import type { SnapshotStatus } from "@/types/snapshots";

interface Props {
  /** Source of truth, owned by parent. Every change is pushed up via onMessagesChange. */
  messages: Message[];
  conversationTitle: string;
  snapshotStatus: SnapshotStatus | null;
  lastRefreshed: { pudds: string | null; extractor: string | null };
  onSync: () => Promise<void>;
  syncing: boolean;
  onMessagesChange: (messages: Message[]) => void;
}

export function ChatPanel({
  messages,
  conversationTitle,
  snapshotStatus,
  lastRefreshed,
  onSync,
  syncing,
  onMessagesChange,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);

  const hasNewer = (snapshotDate: string | null, pulled: string | null) =>
    !!snapshotDate && (!pulled || new Date(snapshotDate) > new Date(pulled));

  const isStale =
    hasNewer(snapshotStatus?.pudds.syncedAt ?? null, lastRefreshed.pudds) ||
    hasNewer(snapshotStatus?.extractor.syncedAt ?? null, lastRefreshed.extractor);

  const sendMessage = useCallback(
    async (content: string) => {
      if (isLoading) return;

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        createdAt: new Date().toISOString(),
      };
      const assistantId = crypto.randomUUID();
      const assistantMsg: Message = {
        id: assistantId,
        role: "assistant",
        content: "",
        charts: [],
        status: "Fetching trial data…",
        createdAt: new Date().toISOString(),
      };

      // Track the in-flight message list locally during streaming. Each
      // mutation pushes the new array up to the parent (which persists it).
      let working: Message[] = [...messages, userMsg, assistantMsg];
      onMessagesChange(working);
      setIsLoading(true);

      const patch = (p: Partial<Message>) => {
        working = working.map((m) =>
          m.id === assistantId ? { ...m, ...p } : m,
        );
        onMessagesChange(working);
      };

      const addChart = (spec: ChartSpec) => {
        working = working.map((m) =>
          m.id === assistantId
            ? { ...m, charts: [...(m.charts ?? []), spec] }
            : m,
        );
        onMessagesChange(working);
      };

      const addToolCall = (call: ToolCall) => {
        working = working.map((m) =>
          m.id === assistantId
            ? { ...m, toolCalls: [...(m.toolCalls ?? []), call] }
            : m,
        );
        onMessagesChange(working);
      };

      const apiHistory: ApiMessage[] = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiHistory }),
        });
        if (!res.ok) {
          const body = await res.text();
          patch({ content: `Error: ${body || res.statusText}`, status: null });
          return;
        }

        for await (const event of readAgentStream(res)) {
          if (event.type === "status") {
            patch({ status: event.text });
          } else if (event.type === "tool_call") {
            addToolCall(event.call);
          } else if (event.type === "chart") {
            addChart(event.spec);
          } else if (event.type === "text") {
            patch({ content: event.text, status: null });
          } else if (event.type === "error") {
            patch({ content: `Error: ${event.text}`, status: null });
          }
        }
      } catch (err) {
        patch({
          content: `Error: ${err instanceof Error ? err.message : String(err)}`,
          status: null,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages, onMessagesChange],
  );

  const hasMessages = messages.length > 0;

  // Native browser print → "Save as PDF" works in every browser. Print CSS
  // (in globals.css) hides the sidebar/input/buttons so only the chat
  // content makes it onto the page.
  const handleExport = () => window.print();

  return (
    <div className="flex flex-col h-full min-h-0 bg-white">
      <ChatHeader
        title={hasMessages ? conversationTitle : "New conversation"}
        onExport={handleExport}
        canExport={hasMessages}
      />
      {hasMessages ? (
        <MessageList messages={messages} />
      ) : (
        <WelcomeScreen
          onSelectPrompt={sendMessage}
          isStale={isStale}
          onSync={() => void onSync()}
          syncing={syncing}
        />
      )}
      <InputBar
        onSend={sendMessage}
        isLoading={isLoading}
        snapshotStatus={snapshotStatus}
        lastRefreshed={lastRefreshed}
        onSync={() => void onSync()}
        syncing={syncing}
        isStale={isStale}
      />
    </div>
  );
}
