import type { AgentEvent } from "@/types/messages";

/**
 * Reads an SSE response body and yields parsed AgentEvent payloads.
 * Caller awaits the async iterator.
 */
export async function* readAgentStream(
  response: Response,
): AsyncGenerator<AgentEvent> {
  if (!response.body) throw new Error("Response has no body");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const raw of events) {
      const trimmed = raw.trim();
      if (!trimmed.startsWith("data: ")) continue;
      const payload = trimmed.slice(6);
      try {
        yield JSON.parse(payload) as AgentEvent;
      } catch {
        // Drop malformed events silently — caller will see "done" eventually.
      }
    }
  }
}
