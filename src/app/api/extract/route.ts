import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { CAPTURE_SCHEMA } from "@/lib/schema";

export const maxDuration = 120;

const SYSTEM = `You process what comes back from the field -- site photos,
handwritten notes, signed slips -- and match each capture to the right job
from the job list provided in the request.

Rules that are the product, not suggestions:
- Match only on evidence actually present (an address fragment, a PM's name,
  a PO or job number) and quote that evidence in match_reasoning.
- If the evidence supports no single job, matched_job_id is "" and
  match_confidence is "none". A wrong-job match is the worst failure this
  system can produce; "none" is always acceptable.
- Anything illegible goes in flagged_as_unreadable verbatim, with a location
  hint. Flagging is correct behaviour; guessing is a defect.`;

type Payload = {
  jobs?: string;
  text?: string;
  image?: { media_type: "image/jpeg" | "image/png" | "image/webp"; data: string };
};

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured on the server." },
      { status: 503 },
    );
  }

  let payload: Payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }

  const hasText = typeof payload.text === "string" && payload.text.trim().length > 0;
  const hasImage = Boolean(payload.image?.data && payload.image.media_type);
  if (!hasText && !hasImage) {
    return NextResponse.json(
      { error: "Provide `text` or `image` to extract from." },
      { status: 400 },
    );
  }
  // ~7MB base64 ≈ 5MB image, Claude's per-image ceiling.
  if (hasImage && payload.image!.data.length > 7_000_000) {
    return NextResponse.json({ error: "Image too large (5MB max)." }, { status: 413 });
  }

  const content: Anthropic.ContentBlockParam[] = hasImage
    ? [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: payload.image!.media_type,
            data: payload.image!.data,
          },
        },
        { type: "text", text: `Match this capture against these open jobs and extract the record.\n\n<jobs>\n${payload.jobs ?? ""}\n</jobs>` },
      ]
    : [
        {
          type: "text",
          text: `Match this capture against these open jobs and extract the record.\n\n<jobs>\n${payload.jobs ?? ""}\n</jobs>\n\n<capture>\n${payload.text}\n</capture>`,
        },
      ];

  const client = new Anthropic();
  try {
    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 8000,
      system: SYSTEM,
      messages: [{ role: "user", content }],
      output_config: {
        format: { type: "json_schema", schema: CAPTURE_SCHEMA },
      },
    });

    const text = response.content.find((b) => b.type === "text");
    if (!text || text.type !== "text") {
      return NextResponse.json({ error: "Model returned no output." }, { status: 502 });
    }
    // output_config guarantees the text parses against CAPTURE_SCHEMA.
    return NextResponse.json({ record: JSON.parse(text.text) });
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      const friendly =
        error instanceof Anthropic.AuthenticationError
          ? "The server's API key was rejected."
          : error instanceof Anthropic.RateLimitError
            ? "Rate limited — try again in a moment."
            : `Extraction failed (${error.status}).`;
      return NextResponse.json({ error: friendly }, { status: 502 });
    }
    throw error;
  }
}
