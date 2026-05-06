"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { createClient } from "@/lib/supabase/client";
import {
  loadConversations,
  saveConversations,
  createConversation,
  upsertConversation,
  deleteConversation,
} from "@/lib/conversations";
import type { Conversation, Message } from "@/types/messages";
import type { SnapshotStatus } from "@/types/snapshots";

export default function Home() {
  const router = useRouter();
  const supabase = createClient();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [snapshotStatus, setSnapshotStatus] = useState<SnapshotStatus | null>(
    null,
  );
  const [syncing, setSyncing] = useState(false);
  const [user, setUser] = useState<{
    name: string | null;
    email: string | null;
  } | null>(null);

  // Hydrate from localStorage and fetch user/status on mount.
  useEffect(() => {
    setConversations(loadConversations());

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({
          email: data.user.email ?? null,
          name:
            (data.user.user_metadata?.full_name as string | undefined) ??
            data.user.email ??
            null,
        });
      }
    });

    fetchStatus().then(setSnapshotStatus).catch(console.error);
  }, [supabase]);

  const fetchStatus = async (): Promise<SnapshotStatus | null> => {
    const res = await fetch("/api/snapshots/status");
    if (!res.ok) return null;
    return (await res.json()) as SnapshotStatus;
  };

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try {
      const next = await fetchStatus();
      if (next) setSnapshotStatus(next);
    } finally {
      setSyncing(false);
    }
  }, []);

  const active = activeId
    ? (conversations.find((c) => c.id === activeId) ?? null)
    : null;

  const handleMessagesChange = useCallback(
    (messages: Message[]) => {
      setConversations((prev) => {
        let conv = activeId ? prev.find((c) => c.id === activeId) : null;
        if (!conv) {
          conv = createConversation(messages[0]?.content ?? "New conversation");
          setActiveId(conv.id);
        } else if (messages.length > 0 && conv.title === "New conversation") {
          conv = { ...conv, title: messages[0].content.slice(0, 60) };
        }
        const updated: Conversation = { ...conv, messages };
        const next = upsertConversation(prev, updated);
        saveConversations(next);
        return next;
      });
    },
    [activeId],
  );

  const handleNewChat = () => setActiveId(null);
  const handleSelectConversation = (id: string) => setActiveId(id);

  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => {
      const next = deleteConversation(prev, id);
      saveConversations(next);
      return next;
    });
    if (activeId === id) setActiveId(null);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex h-screen w-screen bg-white">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={handleSelectConversation}
        onNew={handleNewChat}
        onDelete={handleDeleteConversation}
        onSignOut={handleSignOut}
        snapshotStatus={snapshotStatus}
        userName={user?.name ?? null}
        userEmail={user?.email ?? null}
      />
      <main className="flex-1 flex flex-col min-w-0">
        <ChatPanel
          conversationId={active?.id ?? null}
          initialMessages={active?.messages ?? []}
          snapshotStatus={snapshotStatus}
          onSync={handleSync}
          syncing={syncing}
          onMessagesChange={handleMessagesChange}
        />
      </main>
    </div>
  );
}
