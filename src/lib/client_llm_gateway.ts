import { get_logger } from "./logger";
import { debug } from "./debug";
import { toResponsesAPI, fromResponsesAPI } from "./adapter";

const log = get_logger({ id: "llm_gateway" });

let callCounter = 0;

// ─── Types ────────────────────────────────────────────────────────

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMRequest {
  model: string;
  messages: LLMMessage[];
  response_format?: unknown;
  temperature?: number;
  max_tokens?: number;
  call_id?: string;
}

export interface LLMResponse {
  content: string;
  structured?: unknown;
  raw?: unknown;
}

// ─── Gateway ──────────────────────────────────────────────────────

export async function llmCall(request: LLMRequest): Promise<LLMResponse> {
  const { model, messages, response_format, temperature, max_tokens, call_id } = request;

  const id = call_id || `call_${++callCounter}`;
  const isStructured = !!response_format;
  log(`[${id}] model=${model} messages=${messages.length} structured=${isStructured}`);
  debug.add(`${id}_request`, request);

  // Client-side translation: Chat Completions → Responses API
  const body = toResponsesAPI({ model, messages, response_format, temperature, max_tokens });
  debug.add(`${id}_body`, body);

  const startMs = Date.now();

  try {
    const res = await fetch("/api/secureLlm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const latencyMs = Date.now() - startMs;

    if (!res.ok) {
      const errText = await res.text();
      log(`[${id}] error ${res.status} (${latencyMs}ms): ${errText}`);
      debug.add(`${id}_error`, { status: res.status, error: errText, latencyMs });
      throw new Error(`LLM gateway error: ${res.status} ${errText}`);
    }

    const data = await res.json();
    debug.add(`${id}_raw_response`, data);

    // Client-side wrapping: Responses API → normalized response
    const parsed = fromResponsesAPI(data, model);

    // For structured responses, attempt to parse content as JSON
    let structured: unknown = undefined;
    if (isStructured && parsed.content) {
      try {
        structured = JSON.parse(parsed.content);
      } catch {
        log(`[${id}] structured parse failed, returning raw content`);
      }
    }

    const response: LLMResponse = { content: parsed.content, structured, raw: parsed.raw };
    debug.add(`${id}_response`, response);
    log(`[${id}] complete (${latencyMs}ms), content length=${parsed.content.length}`);

    return response;
  } catch (err) {
    const latencyMs = Date.now() - startMs;
    debug.add(`${id}_error`, {
      message: err instanceof Error ? err.message : String(err),
      latencyMs,
    });
    throw err;
  }
}
