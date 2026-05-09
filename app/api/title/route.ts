import { getAnthropicClient } from "@/lib/anthropic";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let message: string;
  try {
    const body = (await request.json()) as { message?: unknown };
    if (typeof body.message !== "string" || !body.message.trim()) {
      return Response.json({ error: "Invalid request body" }, { status: 400 });
    }
    message = body.message;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 20,
      messages: [
        {
          role: "user",
          content: `Give a 3-5 word title for a chat that begins: "${message.slice(0, 500)}"\n\nReply with only the title, no quotes or punctuation.`,
        },
      ],
    });

    const title =
      response.content[0]?.type === "text"
        ? response.content[0].text.trim()
        : message.slice(0, 60);

    return Response.json({ title });
  } catch {
    return Response.json({ error: "Failed to generate title" }, { status: 500 });
  }
}
