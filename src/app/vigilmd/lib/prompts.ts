import { get_logger } from "@/lib/logger";
import { debug } from "@/lib/debug";

const log = get_logger({ id: "prompt" });

// ─── System context (shared across all dashboard calls) ──────────

const SYSTEM_CONTEXT = `You are an expert clinical decision support assistant for an internal medicine physician on the hospital floor at a large academic hospital. You review all available patient data — demographics, history, medications, vitals, labs, imaging, and exam findings — to provide actionable clinical insights.`;

const OUTPUT_FORMAT = `Return ONLY a JSON array of objects. Each object has these fields:
- action: what to do (e.g. "obtain lab", "obtain imaging", "adjust medication", "agree", "reconsider", "add diagnosis")
- data: specifics (string or object with relevant details)
- reasoning: your thought process and how this changes patient management
- caveat: important limitations or considerations

No text outside the JSON array.`;

// ─── Category-specific prompts ───────────────────────────────────

export const medication_review_prompt = `Review the patient's outpatient and inpatient medications. Identify interactions, medications that should be held given the current presentation, dose adjustments needed, or new medications to consider.

Examples:
REPLACE_EXAMPLES_medication_review`;

export const labs_prompt = `Suggest lab tests that have NOT yet been obtained and would improve care or clarify a diagnosis. Review all provided lab values including electrolytes, chemistries, CBC, and any other results. Specify the exact lab name.

Examples:
REPLACE_EXAMPLES_labs`;

export const imaging_prompt = `Suggest imaging studies that would aid diagnosis or management. Specify the exact modality (CT, MRI, ultrasound, x-ray), location, laterality, and relevant modifiers (e.g. "without contrast", "with IV contrast").

Examples:
REPLACE_EXAMPLES_imaging`;

export const diagnosis_review_prompt = `Review the documented diagnoses and clinical reasoning in the Assessment and Plan. For each diagnosis, output "agree" if supported by the data, "reconsider" if you disagree (with reasoning), or "add diagnosis" if something was missed.

Examples:
REPLACE_EXAMPLES_diagnosis_review`;

// ─── Few-shot examples ──────────────────────────────────────────

export const examples: Record<string, unknown[]> = {
  medication_review: [
    {
      action: "adjust medication",
      data: "Increase metoprolol from 50mg to 100mg daily.",
      reasoning: "Blood pressure remains elevated despite current dose.",
      caveat: "Monitor for bradycardia or hypotension.",
    },
    {
      action: "hold medication",
      data: "Hold lisinopril.",
      reasoning: "Patient is hypotensive; lisinopril can worsen this.",
      caveat: "Reassess once blood pressure stabilizes.",
    },
  ],
  labs: [
    {
      action: "obtain lab",
      data: { lab_name: "hemoglobin concentration" },
      reasoning: "Patient has GI bleeding but hemoglobin has not been checked.",
      caveat: "Excessive blood draws can worsen anemia.",
    },
  ],
  imaging: [
    {
      action: "obtain imaging",
      data: { imaging_name: "CT scan", modifiers: "without contrast", location: "head" },
      reasoning: "Persistent altered mental status after a fall; need to rule out intracranial pathology.",
      caveat: "none",
    },
  ],
  diagnosis_review: [
    {
      action: "reconsider",
      data: { diagnosis: "COPD exacerbation" },
      reasoning: "No shortness of breath or wheezing on exam.",
      caveat: "May have received bronchodilators prior to exam.",
    },
    {
      action: "add diagnosis",
      data: { diagnosis: "Hemolytic anemia" },
      reasoning: "LDH is high and haptoglobin is low, suggesting hemolysis.",
      caveat: "",
    },
  ],
};

// ─── Prompt generation ──────────────────────────────────────────

function injectExamples(prompt: string, prompt_type: string): string {
  const exs = examples[prompt_type];
  if (!exs) return prompt;

  const examplesStr = exs.map((ex) => JSON.stringify(ex, null, 2)).join("\n\n");
  return prompt.replace(
    new RegExp(`REPLACE_EXAMPLES_${prompt_type}`, "g"),
    examplesStr
  );
}

export function generate_full_prompt(
  hp: string,
  prompt_type: string,
  overrides?: Record<string, string>
): string {
  const prompt_map: Record<string, string> = {
    medication_review: overrides?.medication_review ?? medication_review_prompt,
    labs: overrides?.labs ?? labs_prompt,
    imaging: overrides?.imaging ?? imaging_prompt,
    diagnosis_review: overrides?.diagnosis_review ?? diagnosis_review_prompt,
  };

  const categoryPrompt = injectExamples(prompt_map[prompt_type], prompt_type);

  const full = `${SYSTEM_CONTEXT}

${OUTPUT_FORMAT}

--- Patient Information ---

${hp}

--- Instructions ---

${categoryPrompt}`;

  log(`Generated prompt for ${prompt_type}, length=${full.length}`);
  debug.add(`${prompt_type}_prompt`, full);

  return full;
}

export function generate_quick_prompt(
  hp: string,
  prompt_types: string[]
): string {
  log(`Generating quick prompt with types: ${JSON.stringify(prompt_types)}`);

  const categoryPrompts = prompt_types.map((pt) => {
    const injected = injectExamples(
      { medication_review: medication_review_prompt, labs: labs_prompt, imaging: imaging_prompt, diagnosis_review: diagnosis_review_prompt }[pt] || "",
      pt
    );
    return injected;
  });

  const full = `${SYSTEM_CONTEXT}

${OUTPUT_FORMAT}

--- Patient Information ---

${hp}

--- Instructions ---

${categoryPrompts.join("\n\nAdditionally:\n\n")}`;

  debug.add("quick_prompt", full);
  return full;
}
