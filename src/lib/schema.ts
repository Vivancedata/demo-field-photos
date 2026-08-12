/**
 * A field capture -- site photo and/or scrawled note -- matched against the
 * day's open jobs. The match is the product: the pitch is "what comes back
 * from the field lands on the right job, and the illegible gets flagged
 * rather than guessed at".
 */
export interface FieldCapture {
  /** Job id from the provided job list, or "" when no confident match. */
  matched_job_id: string;
  match_confidence: "high" | "low" | "none";
  /** Why this job -- quoting the evidence (address fragment, name, PO). */
  match_reasoning: string;
  capture_type: "site_photo" | "handwritten_note" | "signed_slip" | "other";
  summary: string;
  people_mentioned: string[];
  materials_or_equipment: string[];
  follow_ups: string[];
  /** Verbatim text that could not be read with confidence. */
  flagged_as_unreadable: string[];
}

export const CAPTURE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "matched_job_id", "match_confidence", "match_reasoning", "capture_type",
    "summary", "people_mentioned", "materials_or_equipment", "follow_ups",
    "flagged_as_unreadable",
  ],
  properties: {
    matched_job_id: { type: "string" },
    match_confidence: { type: "string", enum: ["high", "low", "none"] },
    match_reasoning: { type: "string" },
    capture_type: {
      type: "string",
      enum: ["site_photo", "handwritten_note", "signed_slip", "other"],
    },
    summary: { type: "string" },
    people_mentioned: { type: "array", items: { type: "string" } },
    materials_or_equipment: { type: "array", items: { type: "string" } },
    follow_ups: { type: "array", items: { type: "string" } },
    flagged_as_unreadable: { type: "array", items: { type: "string" } },
  },
} as const;
