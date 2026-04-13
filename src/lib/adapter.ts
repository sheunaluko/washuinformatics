import type { LLMMessage, ReasoningEffort, Verbosity } from "./client_llm_gateway";

/**
 * Translates Chat Completions request args → Responses API body format.
 */
export function toResponsesAPI(opts: {
  model: string;
  messages: LLMMessage[];
  response_format?: unknown;
  temperature?: number;
  max_tokens?: number;
  reasoning?: { effort: ReasoningEffort };
  verbosity?: Verbosity;
}): Record<string, unknown> {
  const { model, messages, response_format, temperature, max_tokens, reasoning, verbosity } = opts;

  const body: Record<string, unknown> = {
    model,
    input: (messages || []).map((m) => ({ type: "message", ...m })),
  };

  if (temperature !== undefined) body.temperature = temperature;
  if (max_tokens !== undefined) body.max_output_tokens = max_tokens;

  // Translate structured output: response_format → text.format
  if (response_format && typeof response_format === "object") {
    const rf = response_format as Record<string, unknown>;
    if (rf.json_schema) {
      const js = rf.json_schema as Record<string, unknown>;
      body.text = {
        format: {
          type: "json_schema",
          name: js.name || "response",
          schema: js.schema,
          strict: true,
        },
      };
    } else {
      body.text = { format: response_format };
    }
  }

  // Reasoning effort
  if (reasoning) body.reasoning = reasoning;

  // Verbosity — merge into existing body.text (which may have format from structured output)
  if (verbosity) {
    body.text = { ...(body.text as Record<string, unknown> | undefined), verbosity };
  }

  // temperature is only valid with reasoning effort "none"; drop it otherwise
  if (reasoning && reasoning.effort !== "none") {
    delete body.temperature;
  }

  return body;
}

/**
 * Wraps Responses API response → Chat Completions shape.
 */
export function fromResponsesAPI(
  data: Record<string, unknown>,
  model: string
): {
  content: string;
  model: string;
  usage: unknown;
  finish_reason: string;
  raw: Record<string, unknown>;
} {
  const output_text =
    (data.output_text as string) ??
    (
      data.output as Array<{ content: Array<{ text: string }> }> | undefined
    )?.[0]?.content?.[0]?.text ??
    "";

  return {
    content: output_text,
    model: (data.model as string) || model,
    usage: data.usage,
    finish_reason:
      (data.status as string) || (data.stop_reason as string) || "stop",
    raw: data,
  };
}
