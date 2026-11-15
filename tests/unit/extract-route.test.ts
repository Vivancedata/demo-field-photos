import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/extract/route";
import { SAMPLE_JOBS, SAMPLE_NOTE } from "@/lib/samples";
import type { FieldCapture } from "@/lib/schema";

const RECORD: FieldCapture = {
  matched_job_id: "JOB-4478",
  match_confidence: "high",
  match_reasoning: "“millbrook site”, “ask Tran” — Millbrook Rd, PM S. Tran",
  capture_type: "handwritten_note",
  summary: "Old RTU removed, new unit set.",
  people_mentioned: ["Tran"],
  materials_or_equipment: ["RTU", "gasket kit"],
  follow_ups: ["Confirm electrical rough-in Wednesday"],
  flagged_as_unreadable: ["[unreadable] before 'gasket kit'"],
};

let ipCounter = 0;

function post(body: unknown, headers: Record<string, string> = {}): Request {
  ipCounter += 1;
  return new Request("https://field.vivancedata.com/api/extract", {
    method: "POST",
    headers: {
      origin: "https://field.vivancedata.com",
      "content-type": "application/json",
      // A distinct client per request keeps the in-memory rate limit out of
      // the way unless a test is about it.
      "x-forwarded-for": `198.51.100.${ipCounter}`,
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function anthropicMessage(overrides: Record<string, unknown> = {}) {
  return {
    id: "msg_test",
    type: "message",
    role: "assistant",
    model: "claude-haiku-5-5",
    content: [{ type: "text", text: JSON.stringify(RECORD) }],
    stop_reason: "end_turn",
    stop_sequence: null,
    usage: { input_tokens: 1, output_tokens: 1 },
    ...overrides,
  };
}

/** Stub the network under the real Anthropic SDK. */
function mockAnthropic(status: number, body: unknown) {
  const fetchMock = vi.fn<typeof fetch>(async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json", "x-should-retry": "false" },
    }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function sentBody(fetchMock: ReturnType<typeof mockAnthropic>) {
  const init = fetchMock.mock.calls[0][1];
  return JSON.parse(String(init?.body));
}

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("ANTHROPIC_API_KEY", "sk-ant-test");
});

describe("POST /api/extract — guards", () => {
  it("refuses requests from other origins before doing anything else", async () => {
    const fetchMock = mockAnthropic(200, anthropicMessage());
    const res = await POST(post({ text: "x" }, { origin: "https://evil.example" }));
    expect(res.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reports the demo as offline when no API key is configured", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const res = await POST(post({ text: "x" }));
    expect(res.status).toBe(503);
    expect((await res.json()).error).toMatch(/ANTHROPIC_API_KEY/);
  });

  it.each([
    ["not JSON", "{oops"],
    ["JSON null", "null"],
    ["a JSON array", "[]"],
    ["a JSON string", '"hello"'],
  ])("rejects a body that is %s with 400, not a crash", async (_label, body) => {
    const res = await POST(post(body));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/Body must be JSON/);
  });

  it("requires text or an image", async () => {
    const res = await POST(post({ jobs: SAMPLE_JOBS, text: "   " }));
    expect(res.status).toBe(400);
  });

  it("caps the capture text at 20k characters", async () => {
    const res = await POST(post({ text: "a".repeat(20_001) }));
    expect(res.status).toBe(413);
  });

  it("caps the job list at 20k characters too", async () => {
    const fetchMock = mockAnthropic(200, anthropicMessage());
    const res = await POST(post({ jobs: "a".repeat(20_001), text: "note" }));
    expect(res.status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a non-string job list", async () => {
    const res = await POST(post({ jobs: { a: 1 }, text: "note" }));
    expect(res.status).toBe(400);
  });

  it("caps images at roughly 5 MB", async () => {
    const res = await POST(post({ image: { media_type: "image/png", data: "a".repeat(7_000_001) } }));
    expect(res.status).toBe(413);
  });

  it("rejects image types Claude does not accept", async () => {
    const fetchMock = mockAnthropic(200, anthropicMessage());
    const res = await POST(post({ image: { media_type: "image/gif", data: "R0lGOD" } }));
    expect(res.status).toBe(415);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rate-limits one client after 10 extractions", async () => {
    mockAnthropic(200, anthropicMessage());
    const headers = { "x-forwarded-for": "192.0.2.77" };
    for (let i = 0; i < 10; i++) {
      expect((await POST(post({ text: "note" }, headers))).status).toBe(200);
    }
    const res = await POST(post({ text: "note" }, headers));
    expect(res.status).toBe(429);
    expect(Number(res.headers.get("retry-after"))).toBeGreaterThan(0);
  });
});

describe("POST /api/extract — extraction", () => {
  it("sends the job list and note with the capture schema and returns the record", async () => {
    const fetchMock = mockAnthropic(200, anthropicMessage());
    const res = await POST(post({ jobs: SAMPLE_JOBS, text: SAMPLE_NOTE }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ record: RECORD });

    const sent = sentBody(fetchMock);
    expect(sent.model).toBe("claude-haiku-5-5");
    expect(sent.output_config.format.type).toBe("json_schema");
    expect(sent.output_config.format.schema.required).toContain("matched_job_id");
    const prompt = sent.messages[0].content[0].text as string;
    expect(prompt).toContain(`<jobs>\n${SAMPLE_JOBS}\n</jobs>`);
    expect(prompt).toContain(`<capture>\n${SAMPLE_NOTE}\n</capture>`);
    expect(sent.system).toMatch(/wrong-job match is the worst failure/);
  });

  it("sends an image capture as an image block, ahead of the job list", async () => {
    const fetchMock = mockAnthropic(200, anthropicMessage());
    const res = await POST(
      post({ jobs: SAMPLE_JOBS, text: "ignored", image: { media_type: "image/jpeg", data: "/9j/AAAA" } }),
    );
    expect(res.status).toBe(200);

    const [image, text] = sentBody(fetchMock).messages[0].content;
    expect(image).toEqual({
      type: "image",
      source: { type: "base64", media_type: "image/jpeg", data: "/9j/AAAA" },
    });
    expect(text.text).toContain(SAMPLE_JOBS);
    expect(text.text).not.toContain("<capture>");
  });

  it.each([
    ["refusal", "declined"],
    ["max_tokens", "more output"],
  ])("turns stop_reason %s into a readable 502", async (stop_reason, message) => {
    mockAnthropic(200, anthropicMessage({ stop_reason }));
    const res = await POST(post({ text: "note" }));
    expect(res.status).toBe(502);
    expect((await res.json()).error).toMatch(message);
  });

  it("returns 502 when the model produced no text block", async () => {
    mockAnthropic(200, anthropicMessage({ content: [] }));
    const res = await POST(post({ text: "note" }));
    expect(res.status).toBe(502);
  });

  it.each([
    [401, { type: "error", error: { type: "authentication_error", message: "bad key" } }, /API key was rejected/],
    [429, { type: "error", error: { type: "rate_limit_error", message: "slow down" } }, /Rate limited/],
    [400, { type: "error", error: { type: "invalid_request_error", message: "nope" } }, /Extraction failed \(400\)/],
  ])("maps an upstream %i into a friendly 502", async (status, body, message) => {
    mockAnthropic(status, body);
    const res = await POST(post({ text: "note" }));
    expect(res.status).toBe(502);
    expect((await res.json()).error).toMatch(message);
  });
});
