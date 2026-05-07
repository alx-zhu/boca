import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient } from "@/lib/anthropic";
import { SYSTEM_PROMPT } from "./systemPrompt";
import { TOOLS } from "./tools";
import { runDataFetcher, type DataFetcherInput } from "./tools/dataFetcher";
import { runChartBuilder } from "./tools/chartBuilder";
import type { ApiMessage, AgentEvent } from "@/types/messages";

const MODEL = "claude-sonnet-4-6";
const MAX_ITERATIONS = 5;
const MAX_TOKENS = 4096;

export type SendEvent = (event: AgentEvent) => void;

/**
 * Runs the agent loop. Emits events via `send` as it works:
 *   - "status" before each tool call (transient hint for the spinner)
 *   - "tool_call" after each tool resolves (durable record of the call)
 *   - "chart" for each successful render_chart
 *   - "text" once with the final assistant text
 *
 * Caller is responsible for emitting "done" / "error" around this.
 */
export async function runAgent(
  messages: ApiMessage[],
  send: SendEvent,
): Promise<void> {
  const client = getAnthropicClient();

  let currentMessages: Anthropic.MessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await client.messages.create({
      model: MODEL,
      system: SYSTEM_PROMPT,
      messages: currentMessages,
      tools: TOOLS,
      max_tokens: MAX_TOKENS,
    });

    if (response.stop_reason === "end_turn") {
      send({ type: "text", text: extractText(response.content) });
      return;
    }

    if (response.stop_reason !== "tool_use") {
      send({
        type: "error",
        text: `Unexpected stop_reason: ${response.stop_reason}`,
      });
      return;
    }

    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const block of response.content) {
      if (block.type !== "tool_use") continue;

      if (block.name === "fetch_data") {
        send({ type: "status", text: "Fetching trial data…" });
        try {
          const context = await runDataFetcher(
            block.input as DataFetcherInput,
          );
          send({
            type: "tool_call",
            call: {
              id: block.id,
              name: "fetch_data",
              input: block.input,
              summary: `${context.meta.trialCount} trials, ${context.meta.specCount} ingredient specs`,
            },
          });
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: JSON.stringify(context),
          });
        } catch (err) {
          const message =
            err instanceof Error ? err.message : String(err);
          send({
            type: "tool_call",
            call: {
              id: block.id,
              name: "fetch_data",
              input: block.input,
              summary: `Error: ${message}`,
            },
          });
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: `Error fetching data: ${message}`,
            is_error: true,
          });
        }
        continue;
      }

      if (block.name === "render_chart") {
        send({ type: "status", text: "Building chart…" });
        const result = runChartBuilder(block.input);
        if (result.ok) {
          send({ type: "chart", spec: result.spec });
          send({
            type: "tool_call",
            call: {
              id: block.id,
              name: "render_chart",
              input: block.input,
              summary: result.spec.title,
            },
          });
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: "Chart rendered successfully.",
          });
        } else {
          send({
            type: "tool_call",
            call: {
              id: block.id,
              name: "render_chart",
              input: block.input,
              summary: `Invalid: ${result.reason}`,
            },
          });
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: `Chart spec invalid: ${result.reason}`,
            is_error: true,
          });
        }
        continue;
      }

      // Unknown tool — return an error so the model can recover.
      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: `Unknown tool: ${block.name}`,
        is_error: true,
      });
    }

    send({ type: "status", text: "Analyzing…" });

    currentMessages = [
      ...currentMessages,
      { role: "assistant", content: response.content },
      { role: "user", content: toolResults },
    ];
  }

  send({
    type: "error",
    text: "Reached the maximum number of reasoning steps without a final answer. Try a more specific question.",
  });
}

function extractText(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}
