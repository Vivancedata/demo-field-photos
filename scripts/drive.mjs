#!/usr/bin/env node
// Boots the production build and exercises one feature from docs/feature-map.md.
//   scripts/drive.mjs <feature>   scripts/drive.mjs --all   scripts/drive.mjs --list
// Exit 0 when the feature works, 1 with the reason when it does not.
// Set DRIVE_BASE_URL to drive a server that is already running.
import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { chromium } from "@playwright/test";

const PORT = 4318;
const NOTE_FRAGMENT = /millbrook site/;
const CAPTURE = {
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
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

const fail = (msg) => {
  throw new Error(msg);
};
const check = (cond, msg) => {
  if (!cond) fail(msg);
};
const visible = async (loc, msg) => {
  try {
    await loc.waitFor({ state: "visible", timeout: 5000 });
  } catch {
    fail(msg);
  }
};
const button = (page, name) => page.getByRole("button", { name });
const matchButton = (page) => button(page, /match it to a job/i);
const noteBox = (page) => page.getByRole("textbox", { name: /field note/i });

const features = {
  async "see-what-the-demo-does"(page) {
    check(/Field photos demo/.test(await page.title()), "page title is not 'Field photos demo — Vivancedata'");
    const h1 = await page.getByRole("heading", { level: 1 }).innerText();
    check(/right note on the right job/i.test(h1), `heading reads "${h1}"`);
    await visible(page.getByText(/nothing (you )?submit/i).first(), "intro does not say nothing submitted is stored");
  },
  async "edit-open-jobs"(page) {
    const jobs = page.getByRole("textbox", { name: /today’s open jobs/i });
    check(/JOB-4471 \| Harwood St duplex reframe/.test(await jobs.inputValue()), "jobs box does not start filled with the sample job list");
    await jobs.fill("JOB-1 | Test job");
    check((await jobs.inputValue()) === "JOB-1 | Test job", "typed text did not replace the jobs list");
  },
  async "told-what-to-add"(page) {
    check(await matchButton(page).isDisabled(), "match button is enabled with no note and no photo");
    await visible(page.getByText("Add a field photo, or paste the note that came with it."), "hint under the match button is missing");
  },
  async "paste-field-note"(page) {
    await noteBox(page).fill("Pasted note from the Harwood St job");
    check(await matchButton(page).isEnabled(), "match button stayed disabled after pasting a note");
  },
  async "sample-field-note"(page) {
    await button(page, /sample field note/i).click();
    const value = await noteBox(page).inputValue();
    check(value.startsWith("[SAMPLE FIELD NOTE -- fictional]"), "sample note does not start with [SAMPLE FIELD NOTE -- fictional]");
    check(NOTE_FRAGMENT.test(value), "sample note does not mention the Millbrook site");
    check(await matchButton(page).isEnabled(), "match button stayed disabled after loading the sample note");
  },
  async "attach-photo"(page) {
    await page.locator('input[type="file"]').setInputFiles({ name: "site.png", mimeType: "image/png", buffer: PNG });
    await visible(page.getByText("site.png"), "attached file name is not shown");
    await visible(page.getByRole("button", { name: /remove/i }), "remove link is missing after attaching");
    check((await noteBox(page).count()) === 0, "note box is still shown with a photo attached");
    check(await matchButton(page).isEnabled(), "match button stayed disabled after attaching a photo");
  },
  async "remove-photo"(page) {
    await page.locator('input[type="file"]').setInputFiles({ name: "site.png", mimeType: "image/png", buffer: PNG });
    await page.getByRole("button", { name: /remove/i }).click();
    await visible(noteBox(page), "note box did not come back after remove");
    check((await page.getByText("site.png").count()) === 0, "file name is still shown after remove");
  },
  async "unsupported-file-type"(page) {
    await page.locator('input[type="file"]').setInputFiles({ name: "a.gif", mimeType: "image/gif", buffer: Buffer.from("GIF89a") });
    await visible(
      page.getByText("That file type is not supported. Choose a JPEG, PNG or WebP photo."),
      "unsupported-type message did not appear",
    );
    check((await page.getByText("a.gif").count()) === 0, "unsupported file was attached anyway");
  },
  async "match-to-a-job"(page) {
    await page.route("**/api/extract", (route) => route.fulfill({ json: { record: CAPTURE } }));
    await button(page, /sample field note/i).click();
    await matchButton(page).click();
    await visible(page.getByText("JOB-4478", { exact: true }), "result card does not show JOB-4478");
    await visible(page.getByText("Matched", { exact: true }), "confidence label 'Matched' is missing");
    await visible(page.getByRole("heading", { name: "Flagged, not guessed" }), "unreadable parts are not flagged");
    await visible(page.getByRole("listitem").filter({ hasText: "[unreadable] gasket kit" }), "flagged item is missing");
  },
  async "match-offline"(page) {
    await button(page, /sample field note/i).click();
    await matchButton(page).click();
    await visible(page.getByText(/The demo is offline: ANTHROPIC_API_KEY is not configured/), "offline message did not appear without a key");
  },
  async "visit-vivancedata"(page) {
    const link = page.getByRole("link", { name: "Vivancedata", exact: true }).last();
    const href = await link.getAttribute("href");
    check(href === "https://www.vivancedata.com", `footer link goes to ${href}`);
  },
};

async function boot() {
  if (process.env.DRIVE_BASE_URL) return { url: process.env.DRIVE_BASE_URL, stop() {} };
  if (!existsSync(".next/BUILD_ID")) {
    const build = spawnSync("npm", ["run", "build"], { stdio: "inherit" });
    if (build.status !== 0) fail("npm run build failed");
  }
  const env = { ...process.env };
  delete env.ANTHROPIC_API_KEY;
  env.ALLOWED_ORIGINS = `127.0.0.1,127.0.0.1:${PORT}`;
  const server = spawn("npx", ["next", "start", "--hostname", "127.0.0.1", "--port", String(PORT)], { env, stdio: "ignore" });
  const url = `http://127.0.0.1:${PORT}`;
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(url)).ok) return { url, stop: () => server.kill() };
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  server.kill();
  return fail(`server did not come up on ${url}`);
}

const arg = process.argv[2];
if (arg === "--list") {
  console.log(Object.keys(features).join("\n"));
  process.exit(0);
}
const names = arg === "--all" ? Object.keys(features) : [arg];
if (!arg || names.some((n) => !features[n])) {
  console.error(`usage: scripts/drive.mjs <feature>|--all|--list\nfeatures: ${Object.keys(features).join(", ")}`);
  process.exit(1);
}

let failed = 0;
let server;
let browser;
try {
  server = await boot();
  browser = await chromium.launch();
  for (const name of names) {
    const page = await browser.newPage();
    try {
      await page.goto(server.url);
      await features[name](page);
      console.log(`ok   ${name}`);
    } catch (e) {
      failed++;
      console.log(`FAIL ${name}: ${e.message.split("\n")[0]}`);
    } finally {
      await page.close();
    }
  }
} catch (e) {
  failed++;
  console.log(`FAIL setup: ${e.message}`);
} finally {
  await browser?.close();
  server?.stop();
}
process.exit(failed ? 1 : 0);
