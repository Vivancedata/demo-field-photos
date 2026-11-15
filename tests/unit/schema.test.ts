import { describe, expect, expectTypeOf, it } from "vitest";
import { SAMPLE_JOBS, SAMPLE_NOTE } from "@/lib/samples";
import { CAPTURE_SCHEMA, type FieldCapture } from "@/lib/schema";

describe("CAPTURE_SCHEMA", () => {
  it("requires exactly the fields of FieldCapture and allows nothing else", () => {
    expect(CAPTURE_SCHEMA.additionalProperties).toBe(false);
    expect([...CAPTURE_SCHEMA.required].sort()).toEqual(Object.keys(CAPTURE_SCHEMA.properties).sort());
    expectTypeOf<(typeof CAPTURE_SCHEMA.required)[number]>().toEqualTypeOf<keyof FieldCapture>();
  });

  it("keeps its enums in step with the TypeScript unions the UI switches on", () => {
    expectTypeOf<(typeof CAPTURE_SCHEMA.properties.match_confidence.enum)[number]>()
      .toEqualTypeOf<FieldCapture["match_confidence"]>();
    expectTypeOf<(typeof CAPTURE_SCHEMA.properties.capture_type.enum)[number]>()
      .toEqualTypeOf<FieldCapture["capture_type"]>();
    // "none" must stay a valid answer: no-match is the product's safe default.
    expect(CAPTURE_SCHEMA.properties.match_confidence.enum).toContain("none");
  });
});

describe("samples", () => {
  it("are labelled fictional in their first line", () => {
    expect(SAMPLE_JOBS.split("\n")[0]).toMatch(/SAMPLE.*fictional/);
    expect(SAMPLE_NOTE.split("\n")[0]).toMatch(/SAMPLE.*fictional/);
  });

  it("keep the deliberate defects that make flagging show on first click", () => {
    expect(SAMPLE_NOTE).toContain("[unreadable]");
    expect(SAMPLE_NOTE).toMatch(/torn corner/);
  });

  it("include the job the sample note belongs to", () => {
    expect(SAMPLE_JOBS).toMatch(/JOB-\d+ \| Millbrook/);
    expect(SAMPLE_NOTE).toMatch(/millbrook/i);
  });
});
