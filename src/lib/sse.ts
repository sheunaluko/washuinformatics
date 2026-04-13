/**
 * SSE stream consumer for the OpenAI Responses API.
 *
 * Reads a streaming SSE response and returns the completed response object
 * (same shape as a non-streaming response), keeping the connection alive
 * to avoid serverless idle timeouts.
 */

/**
 * Consume an SSE stream from the LLM proxy and return the completed
 * response object. Falls back to res.json() if the response is not SSE.
 */
export async function consumeSSEStream(
  res: Response
): Promise<Record<string, unknown>> {
  const contentType = res.headers.get("content-type") || "";

  // Fallback: if not SSE, parse as JSON (backwards compatibility)
  if (!contentType.includes("text/event-stream")) {
    return res.json();
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let completedResponse: Record<string, unknown> | null = null;
  let accumulatedText = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE events are separated by double newlines
      const events = buffer.split("\n\n");
      buffer = events.pop()!; // last element may be incomplete

      for (const eventBlock of events) {
        const parsed = parseSSEEvent(eventBlock);
        if (!parsed) continue;

        if (parsed.event === "response.completed") {
          completedResponse = parsed.data.response as Record<string, unknown>;
        } else if (parsed.event === "response.output_text.delta") {
          accumulatedText += (parsed.data.delta as string) || "";
        } else if (parsed.event === "error") {
          throw new Error(
            `LLM stream error: ${JSON.stringify(parsed.data)}`
          );
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  // Primary path: use the completed response
  if (completedResponse) {
    return completedResponse;
  }

  // Fallback: synthesize from accumulated deltas
  return {
    output_text: accumulatedText,
    output: [
      { content: [{ text: accumulatedText, type: "output_text" }] },
    ],
    status: "completed",
  };
}

/** Parse a single SSE event block into its event name and JSON data. */
function parseSSEEvent(
  block: string
): { event: string; data: Record<string, unknown> } | null {
  let event = "";
  let data = "";

  for (const line of block.split("\n")) {
    if (line.startsWith("event: ")) {
      event = line.slice(7);
    } else if (line.startsWith("data: ")) {
      data = line.slice(6);
    }
  }

  if (!data || data === "[DONE]") return null;

  try {
    return { event, data: JSON.parse(data) };
  } catch {
    return null;
  }
}
