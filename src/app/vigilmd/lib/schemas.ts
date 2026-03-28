import { z } from "zod";

export const diagnosis_group = z.object({
  diagnoses: z.array(z.string()),
  narrative_summary: z.string(),
  plan_items: z.array(z.string()),
});

export const handoff_response_structure = z.object({
  one_liner: z.string(),
  diagnosis_groups: z.array(diagnosis_group),
});

export type HandoffResponse = z.infer<typeof handoff_response_structure>;
