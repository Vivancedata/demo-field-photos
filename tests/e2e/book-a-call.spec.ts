import { expect, test } from "@playwright/test";
import type { FieldCapture } from "../../src/lib/schema";

const CAPTURE: FieldCapture = {
  matched_job_id: "JOB-4478",
  match_confidence: "high",
  match_reasoning: "“millbrook site” matches 44 Millbrook Rd",
  capture_type: "handwritten_note",
  summary: "Old RTU out, new unit set.",
  people_mentioned: ["Tran"],
  materials_or_equipment: ["RTU", "gasket kit"],
  follow_ups: ["Ask Tran about electrical rough-in"],
  flagged_as_unreadable: ["[unreadable] gasket kit", "torn corner"],
};

test.use({ viewport: { width: 390, height: 844 } });

test("on a phone, the sample note reaches a result and a book-a-call link", async ({ page }, testInfo) => {
  await page.route("/api/extract", (route) => route.fulfill({ json: { record: CAPTURE } }));

  await page.goto("/");
  await page.getByRole("button", { name: /sample field note/i }).click();
  await page.getByRole("button", { name: /match it to a job/i }).click();
  await expect(page.getByText("JOB-4478", { exact: true })).toBeVisible();

  const cta = page.getByRole("link", { name: /book a call/i });
  await cta.scrollIntoViewIfNeeded();
  await expect(cta).toBeVisible();
  await expect(cta).toHaveAttribute("href", "https://www.vivancedata.com/contact?utm_source=demo-field-photos");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);

  await page.screenshot({ path: testInfo.outputPath("book-a-call-390.png"), fullPage: true });
});
