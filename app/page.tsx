"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { createClient } from "@/lib/supabase/client";
import {
  loadConversations,
  saveConversations,
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
  // Stable id for the "new conversation" mode. When the user sends the first
  // message we promote it to activeId so the ChatPanel `key` stays the same
  // across the transition (no remount mid-stream).
  const [draftId, setDraftId] = useState<string>(() => crypto.randomUUID());
  const [snapshotStatus, setSnapshotStatus] = useState<SnapshotStatus | null>(
    null,
  );
  const [lastRefreshed, setLastRefreshed] = useState<{
    pudds: string | null;
    extractor: string | null;
  }>({ pudds: null, extractor: null });
  const [syncing, setSyncing] = useState(false);
  const [user, setUser] = useState<{
    name: string | null;
    email: string | null;
  } | null>(null);

  // Declared BEFORE the mount effect that captures it — otherwise the
  // compiler flags TDZ access since `const` declarations don't hoist.
  const fetchStatus = useCallback(async (): Promise<SnapshotStatus | null> => {
    const res = await fetch("/api/snapshots/status");
    if (!res.ok) return null;
    return (await res.json()) as SnapshotStatus;
  }, []);

  // Hydrate from localStorage and remote sources on mount. All setState
  // calls are deferred (microtask or .then callback) so none of them run
  // synchronously in the effect body, which would cause cascading renders.
  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;
      setConversations(loadConversations());
      setLastRefreshed({
        pudds: localStorage.getItem("boca:last-sync:pudds"),
        extractor: localStorage.getItem("boca:last-sync:extractor"),
      });
    });

    supabase.auth.getUser().then(({ data }) => {
      if (cancelled || !data.user) return;
      setUser({
        email: data.user.email ?? null,
        name:
          (data.user.user_metadata?.full_name as string | undefined) ??
          data.user.email ??
          null,
      });
    });

    fetchStatus()
      .then((s) => {
        if (!cancelled && s) setSnapshotStatus(s);
      })
      .catch(console.error);

    return () => {
      cancelled = true;
    };
  }, [supabase, fetchStatus]);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try {
      const next = await fetchStatus();
      if (next) {
        setSnapshotStatus(next);
        const refreshed = {
          pudds: next.pudds.syncedAt,
          extractor: next.extractor.syncedAt,
        };
        if (refreshed.pudds)
          localStorage.setItem("boca:last-sync:pudds", refreshed.pudds);
        if (refreshed.extractor)
          localStorage.setItem("boca:last-sync:extractor", refreshed.extractor);
        setLastRefreshed(refreshed);
      }
    } finally {
      setSyncing(false);
    }
  }, [fetchStatus]);

  const active = activeId
    ? (conversations.find((c) => c.id === activeId) ?? null)
    : null;

  // Refs let handleMessagesChange (called repeatedly during a streamed turn)
  // see the latest activeId/draftId without re-creating the callback.
  const activeIdRef = useRef(activeId);
  const draftIdRef = useRef(draftId);
  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);
  useEffect(() => {
    draftIdRef.current = draftId;
  }, [draftId]);

  const handleMessagesChange = useCallback((messages: Message[]) => {
    let id = activeIdRef.current;
    if (!id) {
      // Promote draft → active, then mint a fresh draft for the next
      // "New chat". Sync ref updates first so subsequent calls in the same
      // turn don't try to re-promote.
      id = draftIdRef.current;
      activeIdRef.current = id;
      const nextDraft = crypto.randomUUID();
      draftIdRef.current = nextDraft;
      setActiveId(id);
      setDraftId(nextDraft);

      // Fire-and-forget: replace the truncated title with a Haiku-generated one.
      const firstContent = messages[0]?.content;
      if (firstContent) {
        const convId = id;
        fetch("/api/title", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: firstContent }),
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data: { title: string } | null) => {
            if (!data?.title) return;
            setConversations((prev) => {
              const conv = prev.find((c) => c.id === convId);
              if (!conv) return prev;
              const next = upsertConversation(prev, { ...conv, title: data.title });
              saveConversations(next);
              return next;
            });
          })
          .catch(() => {});
      }
    }

    setConversations((prev) => {
      const existing = prev.find((c) => c.id === id);
      const title =
        messages[0]?.content?.slice(0, 60) || "New conversation";
      const conv: Conversation = existing
        ? {
            ...existing,
            title:
              existing.title === "New conversation" ? title : existing.title,
            messages,
          }
        : {
            id: id!,
            title,
            messages,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
      const next = upsertConversation(prev, conv);
      saveConversations(next);
      return next;
    });
  }, []);

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

  // Stable across the null → realId transition for the current draft, but
  // changes when the user picks a different conversation or hits "New chat"
  // (which mints a new draft). ChatPanel remounts only on real switches.
  const panelKey = activeId ?? draftId;

  return (
    <div className="flex h-screen w-screen bg-white overflow-hidden">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={handleSelectConversation}
        onNew={handleNewChat}
        onDelete={handleDeleteConversation}
        onSignOut={handleSignOut}
        snapshotStatus={snapshotStatus}
        lastRefreshed={lastRefreshed}
        userName={user?.name ?? null}
        userEmail={user?.email ?? null}
      />
      <main className="flex-1 flex flex-col min-w-0 min-h-0">
        <ChatPanel
          key={panelKey}
          messages={active?.messages ?? []}
          conversationTitle={active?.title ?? "New conversation"}
          snapshotStatus={snapshotStatus}
          lastRefreshed={lastRefreshed}
          onSync={handleSync}
          syncing={syncing}
          onMessagesChange={handleMessagesChange}
        />
      </main>
    </div>
  );
}
