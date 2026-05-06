import { runAgent } from "@/agent";
import { createClient } from "@/lib/supabase/server";
import type { ApiMessage, AgentEvent } from "@/types/messages";

export const runtime = "nodejs";
export const maxDuration = 25;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let messages: ApiMessage[];
  try {
    const body = (await request.json()) as { messages?: ApiMessage[] };
    if (!Array.isArray(body.messages)) {
      return Response.json({ error: "Invalid request body" }, { status: 400 });
    }
    messages = body.messages;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: AgentEvent) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
        );
      };
      try {
        await runAgent(messages, send);
      } catch (err) {
        send({
          type: "error",
          text: err instanceof Error ? err.message : String(err),
        });
      } finally {
        send({ type: "done" });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
