import { llmCall } from "@/lib/client_llm_gateway";
import { get_logger } from "@/lib/logger";
import { debug } from "@/lib/debug";
import * as prompts from "./prompts";
import { generate_prompt as generate_hp_prompt } from "./hp";

const log = get_logger({ id: "cds_util" });

export const default_model = "gpt-5.4";

export async function generate_hp(ops: {
  clinical_information: string;
  model?: string;
}): Promise<string> {
  const { clinical_information, model } = ops;

  const prompt = generate_hp_prompt(clinical_information);
  const response = await llmCall({
    model: model || default_model,
    messages: [
      {
        role: "system",
        content:
          "You are an expert clinician that generates synthetic history and physical notes for the user.",
      },
      { role: "user", content: prompt },
    ],
  });

  debug.add("hp_content", response.content);
  let filtered = response.content
    .replace("```markdown", "")
    .replace("```", "");
  filtered = filtered
    .replace("- BEGIN H&P INSTRUCTIONS -", "")
    .replace("- END H&P INSTRUCTIONS -", "")
    .trim();
  return filtered;
}

export async function get_all_dashboard_info(ops: {
  hp: string;
  model?: string;
}): Promise<unknown[] | null> {
  const { hp, model } = ops;

  const dashboard_prompt = prompts.generate_quick_prompt(hp, [
    "medication_review",
    "labs",
    "imaging",
    "diagnosis_review",
  ]);

  log("Generated dashboard prompt: " + dashboard_prompt);

  const response = await llmCall({
    model: model || default_model,
    messages: [
      {
        role: "system",
        content:
          "You are an expert and enthusiastic clinical decision support tool",
      },
      { role: "user", content: dashboard_prompt },
    ],
  });

  debug.add("content", response.content);

  const dashboard_info = extractJsonArray(response.content);
  debug.add("dashboard_info", dashboard_info);

  if (dashboard_info) {
    log("Extracted dashboard info: " + JSON.stringify(dashboard_info));
    return dashboard_info;
  } else {
    log("Error: Failed to extract valid JSON array from response.");
    return null;
  }
}

export async function get_individual_dashboard_info(ops: {
  hp: string;
  dashboard_name: string;
  model?: string;
  prompt_overrides?: Record<string, string>;
}): Promise<unknown[] | null> {
  const { hp, dashboard_name, model, prompt_overrides } = ops;

  const dashboard_prompt = prompts.generate_full_prompt(hp, dashboard_name, prompt_overrides);
  log("Generated dashboard prompt: " + dashboard_prompt);

  const response = await llmCall({
    model: model || "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "You are an expert and enthusiastic clinical decision support tool",
      },
      { role: "user", content: dashboard_prompt },
    ],
  });

  debug.add("content", response.content);

  const dashboard_info = extractJsonArray(response.content);
  debug.add("dashboard_info", dashboard_info);

  if (dashboard_info) {
    log("Extracted dashboard info: " + JSON.stringify(dashboard_info));
    return dashboard_info;
  } else {
    log("Error: Failed to extract valid JSON array from response.");
    return null;
  }
}

export async function get_handoff(ops: {
  patient_information: string;
  prompt_template: string;
  parameters: string;
  conciseness_block: string;
  response_format: unknown;
  model?: string;
  user_examples?: string;
}): Promise<unknown> {
  const {
    patient_information,
    prompt_template,
    parameters,
    conciseness_block,
    response_format,
    model,
    user_examples,
  } = ops;

  let prompt = prompt_template
    .replace("{patient_information}", patient_information)
    .replace("{parameters}", parameters)
    .replace("{conciseness_descriptions}", conciseness_block);

  if (user_examples) {
    prompt += user_examples;
  }

  debug.add("handoff_prompt", prompt);

  const response = await llmCall({
    model: model || "gpt-4o-mini-2024-07-18",
    messages: [
      { role: "system", content: "you are an expert medical assistant" },
      { role: "user", content: prompt },
    ],
    response_format,
  });

  log("Received handoff response!");
  debug.add("handoff_response", response);

  return response.structured ?? response.content;
}

function all_indexes_of_ch(val: string, arr: string): number[] {
  const indexes: number[] = [];
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === val) indexes.push(i);
  }
  return indexes;
}

export function extractJsonArray(text: string): unknown[] | null {
  const si_s = all_indexes_of_ch("[", text);
  const ei_s = all_indexes_of_ch("]", text);

  if (si_s.length > 0 && ei_s.length > 0) {
    const si = si_s[0];
    const ei = ei_s[ei_s.length - 1];
    log(`Using start index:${si} and end index: ${ei}`);

    const extracted_string = text.slice(si, ei + 1);
    debug.add("extracted_string", extracted_string);

    try {
      return JSON.parse(extracted_string);
    } catch (error) {
      log("Error parsing JSON array: " + (error instanceof Error ? error.message : String(error)));
      return null;
    }
  } else {
    log("Could not find either [ or ]");
    return null;
  }
}
