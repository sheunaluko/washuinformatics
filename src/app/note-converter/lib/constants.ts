export const DEFAULT_MODEL = "gpt-5.4";

export const VERBOSITY_LABELS: Record<number, string> = {
  1: "Very Brief",
  2: "Brief",
  3: "Standard",
  4: "Detailed",
  5: "Very Detailed",
};

export const VERBOSITY_GUIDANCE: Record<number, string> = {
  1: "Be extremely concise. Use minimal words. Focus only on critical information.",
  2: "Be concise. Include essential details but keep it brief.",
  3: "Provide a balanced level of detail. Include important clinical information.",
  4: "Be detailed. Include comprehensive clinical information and context.",
  5: "Be very detailed. Include all relevant clinical information, reasoning, and context.",
};
