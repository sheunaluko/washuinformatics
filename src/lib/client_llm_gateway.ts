import { get_logger } from "./logger";
import { debug } from "./debug";
import { toResponsesAPI, fromResponsesAPI } from "./adapter";

const log = get_logger({ id: "llm_gateway" });

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
}

export interface LLMResponse {
  content: string;
  structured?: unknown;
  raw?: unknown;
}

// ─── Gateway ──────────────────────────────────────────────────────

export async function llmCall(request: LLMRequest): Promise<LLMResponse> {
  const { model, messages, response_format, temperature, max_tokens } = request;

  const isStructured = !!response_format;
  log(`llmCall: model=${model} messages=${messages.length} structured=${isStructured}`);
  debug.add("llm_request", request);

  // Client-side translation: Chat Completions → Responses API
  const body = toResponsesAPI({ model, messages, response_format, temperature, max_tokens });
  debug.add("llm_request_body", body);

  const res = await fetch("/api/secureLlm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  debug.add("llm_fetch_response", res);

  if (!res.ok) {
    const errText = await res.text();
    log(`llmCall: error ${res.status}: ${errText}`);
    throw new Error(`LLM gateway error: ${res.status} ${errText}`);
  }

  const data = await res.json();
  debug.add("llm_raw_response", data);

  // Client-side wrapping: Responses API → normalized response
  const parsed = fromResponsesAPI(data, model);

  // For structured responses, attempt to parse content as JSON
  let structured: unknown = undefined;
  if (isStructured && parsed.content) {
    try {
      structured = JSON.parse(parsed.content);
    } catch {
      log("llmCall: structured parse failed, returning raw content");
    }
  }

  const response: LLMResponse = { content: parsed.content, structured, raw: parsed.raw };
  debug.add("llm_parsed_response", response);
  log(`llmCall: complete, content length=${parsed.content.length}`);

  return response;
}
