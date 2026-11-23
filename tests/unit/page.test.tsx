// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Home from "@/app/page";
import { SAMPLE_JOBS, SAMPLE_NOTE } from "@/lib/samples";
import type { FieldCapture } from "@/lib/schema";

const CAPTURE: FieldCapture = {
  matched_job_id: "JOB-4478",
  match_confidence: "low",
  match_reasoning: "“millbrook site” matches 44 Millbrook Rd",
  capture_type: "handwritten_note",
  summary: "Old RTU out, new unit set.",
  people_mentioned: ["Tran"],
  materials_or_equipment: [],
  follow_ups: ["Ask Tran about electrical rough-in"],
  flagged_as_unreadable: ["[unreadable] gasket kit", "torn corner"],
};

function mockFetch(status: number, body: unknown) {
  const fetchMock = vi.fn<typeof fetch>(async () =>
    new Response(typeof body === "string" ? body : JSON.stringify(body), { status }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const submit = () => screen.getByRole("button", { name: /match it to a job/i });
const noteBox = () => screen.getByRole("textbox", { name: /field note/i });

describe("field photos page", () => {
  it("renders the pitch, the sample job list and a disabled submit with a hint", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { level: 1, name: /right note on the right job/i })).toBeVisible();
    expect(screen.getByRole("textbox", { name: /today’s open jobs/i })).toHaveValue(SAMPLE_JOBS);
    expect(submit()).toBeDisabled();
    expect(screen.getByText(/add a field photo, or paste the note/i)).toBeVisible();
  });

  it("loads the sample note and enables matching", async () => {
    const user = userEvent.setup();
    render(<Home />);
    await user.click(screen.getByRole("button", { name: /sample field note/i }));
    expect(noteBox()).toHaveValue(SAMPLE_NOTE);
    expect(submit()).toBeEnabled();
  });

  it("does not enable matching for whitespace", async () => {
    const user = userEvent.setup();
    render(<Home />);
    await user.type(noteBox(), "   ");
    expect(submit()).toBeDisabled();
  });

  it("posts the jobs and note, then shows the match, its evidence and what was flagged", async () => {
    const user = userEvent.setup();
    const fetchMock = mockFetch(200, { record: CAPTURE });
    render(<Home />);
    await user.click(screen.getByRole("button", { name: /sample field note/i }));
    await user.click(submit());

    expect(await screen.findByText("JOB-4478")).toBeVisible();
    expect(fetchMock).toHaveBeenCalledWith("/api/extract", expect.objectContaining({ method: "POST" }));
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({ jobs: SAMPLE_JOBS, text: SAMPLE_NOTE });

    expect(screen.getByText(/tentative — confirm before filing/i)).toBeVisible();
    expect(screen.getByText(CAPTURE.match_reasoning)).toBeVisible();
    expect(screen.getByText("Capture").nextElementSibling).toHaveTextContent("Handwritten note");
    expect(screen.getByRole("heading", { name: /flagged, not guessed/i })).toBeVisible();
    expect(screen.getByText("torn corner")).toBeVisible();
    expect(screen.getByText("Capture matched. The result is below.")).toBeInTheDocument();
  });

  it("shows no job id when there is no confident match", async () => {
    const user = userEvent.setup();
    mockFetch(200, {
      record: { ...CAPTURE, matched_job_id: "", match_confidence: "none", flagged_as_unreadable: [] },
    });
    render(<Home />);
    await user.click(screen.getByRole("button", { name: /sample field note/i }));
    await user.click(submit());

    expect(await screen.findByText("No confident match")).toBeVisible();
    expect(screen.queryByText("JOB-4478")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /flagged, not guessed/i })).not.toBeInTheDocument();
  });

  it("clears a stale result as soon as the note is edited", async () => {
    const user = userEvent.setup();
    mockFetch(200, { record: CAPTURE });
    render(<Home />);
    await user.click(screen.getByRole("button", { name: /sample field note/i }));
    await user.click(submit());
    await screen.findByText("JOB-4478");

    await user.type(noteBox(), "!");
    expect(screen.queryByText("JOB-4478")).not.toBeInTheDocument();
  });

  it("offers a call only once a result is shown", async () => {
    const user = userEvent.setup();
    mockFetch(200, { record: CAPTURE });
    render(<Home />);
    expect(screen.queryByRole("link", { name: /book a call/i })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /sample field note/i }));
    await user.click(submit());
    await screen.findByText("JOB-4478");

    expect(screen.getByRole("link", { name: /book a call/i })).toHaveAttribute(
      "href",
      "https://www.vivancedata.com/contact?utm_source=demo-field-photos",
    );
  });

  it("shows the server's error message", async () => {
    const user = userEvent.setup();
    mockFetch(429, { error: "Rate limited — try again in 30s." });
    render(<Home />);
    await user.click(screen.getByRole("button", { name: /sample field note/i }));
    await user.click(submit());
    expect(await screen.findByText("Rate limited — try again in 30s.")).toBeVisible();
  });

  it("falls back to a status message when the response is not JSON (proxy timeout)", async () => {
    const user = userEvent.setup();
    mockFetch(504, "<html>Gateway Timeout</html>");
    render(<Home />);
    await user.click(screen.getByRole("button", { name: /sample field note/i }));
    await user.click(submit());
    expect(await screen.findByText(/request failed \(504\)/i)).toBeVisible();
  });

  it.each([
    ["site_photo", "Site photo"],
    ["handwritten_note", "Handwritten note"],
    ["signed_slip", "Signed slip"],
    ["other", "Other"],
  ] as const)("labels a %s capture as “%s”", async (capture_type, label) => {
    const user = userEvent.setup();
    mockFetch(200, { record: { ...CAPTURE, capture_type } });
    render(<Home />);
    await user.click(screen.getByRole("button", { name: /sample field note/i }));
    await user.click(submit());
    await screen.findByText("JOB-4478");
    expect(screen.getByText("Capture").nextElementSibling).toHaveTextContent(label);
  });

  describe("photo capture", () => {
    const fileInput = (container: HTMLElement) =>
      container.querySelector<HTMLInputElement>('input[type="file"]')!;
    const png = () => new File([new Uint8Array([137, 80, 78, 71])], "site.png", { type: "image/png" });

    it("rejects unsupported file types", async () => {
      const user = userEvent.setup({ applyAccept: false });
      const { container } = render(<Home />);
      await user.upload(fileInput(container), new File(["GIF89a"], "anim.gif", { type: "image/gif" }));
      expect(await screen.findByText(/file type is not supported/i)).toBeVisible();
    });

    it("swaps the note box for the photo and sends it base64-encoded", async () => {
      const user = userEvent.setup();
      const fetchMock = mockFetch(200, { record: CAPTURE });
      const { container } = render(<Home />);
      await user.upload(fileInput(container), png());

      expect(await screen.findByText("site.png")).toBeVisible();
      expect(screen.queryByRole("textbox", { name: /field note/i })).not.toBeInTheDocument();
      await user.click(submit());
      await screen.findByText("JOB-4478");

      expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
        jobs: SAMPLE_JOBS,
        image: { media_type: "image/png", data: btoa(String.fromCharCode(137, 80, 78, 71)) },
      });
    });

    it("lets the same photo be chosen again after removing it", async () => {
      const user = userEvent.setup();
      const { container } = render(<Home />);
      const file = png();
      await user.upload(fileInput(container), file);
      await user.click(await screen.findByRole("button", { name: "Remove site.png" }));
      expect(noteBox()).toBeVisible();

      await user.upload(fileInput(container), file);
      expect(await screen.findByText("site.png")).toBeVisible();
    });

    it("clears the previous result when a new photo is chosen", async () => {
      const user = userEvent.setup();
      mockFetch(200, { record: CAPTURE });
      const { container } = render(<Home />);
      await user.click(screen.getByRole("button", { name: /sample field note/i }));
      await user.click(submit());
      await screen.findByText("JOB-4478");

      await user.upload(fileInput(container), png());
      await screen.findByText("site.png");
      await waitFor(() => expect(screen.queryByText("JOB-4478")).not.toBeInTheDocument());
    });
  });
});
