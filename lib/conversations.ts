import type { Conversation, Message } from "@/types/messages";

const KEY = "boca:conversations";

export function loadConversations(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Conversation[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveConversations(convs: Conversation[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(convs));
  } catch {
    // localStorage quota exceeded — accept the loss for the prototype.
  }
}

export function createConversation(firstMessage: string): Conversation {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: firstMessage.slice(0, 60).trim() || "New conversation",
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function upsertConversation(
  convs: Conversation[],
  conv: Conversation,
): Conversation[] {
  const idx = convs.findIndex((c) => c.id === conv.id);
  const updated = { ...conv, updatedAt: new Date().toISOString() };
  if (idx === -1) return [updated, ...convs];
  const next = [...convs];
  next[idx] = updated;
  return next;
}

export function deleteConversation(
  convs: Conversation[],
  id: string,
): Conversation[] {
  return convs.filter((c) => c.id !== id);
}

export function appendMessage(conv: Conversation, msg: Message): Conversation {
  return { ...conv, messages: [...conv.messages, msg] };
}

export function replaceMessage(
  conv: Conversation,
  id: string,
  patch: Partial<Message>,
): Conversation {
  return {
    ...conv,
    messages: conv.messages.map((m) =>
      m.id === id ? { ...m, ...patch } : m,
    ),
  };
}
