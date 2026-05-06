"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { differenceInHours } from "date-fns";
import { MessageList } from "./MessageList";
import { InputBar } from "./InputBar";
import { WelcomeScreen } from "./WelcomeScreen";
import { readAgentStream } from "@/lib/sse";
import type { Message, ApiMessage } from "@/types/messages";
import type { SnapshotStatus } from "@/types/snapshots";

interface Props {
  conversationId: string | null;
  initialMessages: Message[];
  snapshotStatus: SnapshotStatus | null;
  onSync: () => Promise<void>;
  syncing: boolean;
  onMessagesChange: (messages: Message[]) => void;
}

export function ChatPanel({
  conversationId,
  initialMessages,
  snapshotStatus,
  onSync,
  syncing,
  onMessagesChange,
}: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);

  // Reset local state on conversation switch.
  useEffect(() => {
    setMessages(initialMessages);
  }, [conversationId, initialMessages]);

  const isStale = snapshotStatus?.pudds.syncedAt
    ? differenceInHours(new Date(), new Date(snapshotStatus.pudds.syncedAt)) >
      48
    : !snapshotStatus?.pudds.syncedAt;

  // We propagate via a ref so the streaming loop always sees fresh state
  // without re-running the callback on every chunk.
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const update = useCallback(
    (next: Message[] | ((prev: Message[]) => Message[])) => {
      setMessages((prev) => {
        const final = typeof next === "function" ? next(prev) : next;
        messagesRef.current = final;
        onMessagesChange(final);
        return final;
      });
    },
    [onMessagesChange],
  );

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

      const apiHistory: ApiMessage[] = [...messagesRef.current, userMsg].map(
        (m) => ({ role: m.role, content: m.content }),
      );

      update((prev) => [...prev, userMsg, assistantMsg]);
      setIsLoading(true);

      const patch = (p: Partial<Message>) =>
        update((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, ...p } : m)),
        );

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
          } else if (event.type === "chart") {
            update((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, charts: [...(m.charts ?? []), event.spec] }
                  : m,
              ),
            );
          } else if (event.type === "text") {
            patch({ content: event.text, status: null });
          } else if (event.type === "error") {
            patch({
              content: `Error: ${event.text}`,
              status: null,
            });
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
    [isLoading, update],
  );

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-full bg-white">
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
        onSync={() => void onSync()}
        syncing={syncing}
        isStale={isStale}
      />
    </div>
  );
}
