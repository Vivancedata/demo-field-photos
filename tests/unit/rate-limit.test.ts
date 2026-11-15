import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

let ipCounter = 0;
function freshIp(): string {
  ipCounter += 1;
  return `203.0.113.${ipCounter}`;
}

function req(ip: string): Request {
  return new Request("http://internal/api/extract", {
    method: "POST",
    headers: { "x-forwarded-for": `${ip}, 10.0.0.1` },
  });
}

describe("rateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows 10 requests per IP per 10 minutes, then refuses with a retry hint", () => {
    const ip = freshIp();
    for (let i = 0; i < 10; i++) expect(rateLimit(req(ip))).toEqual({ ok: true });

    vi.advanceTimersByTime(60_000);
    expect(rateLimit(req(ip))).toEqual({ ok: false, retryAfterSec: 540 });
  });

  it("keys on the first X-Forwarded-For hop, so other clients are unaffected", () => {
    const noisy = freshIp();
    for (let i = 0; i < 11; i++) rateLimit(req(noisy));
    expect(rateLimit(req(noisy)).ok).toBe(false);
    expect(rateLimit(req(freshIp())).ok).toBe(true);
  });

  it("opens a new window once the old one has passed", () => {
    const ip = freshIp();
    for (let i = 0; i < 11; i++) rateLimit(req(ip));
    expect(rateLimit(req(ip)).ok).toBe(false);

    vi.advanceTimersByTime(10 * 60 * 1000 + 1);
    expect(rateLimit(req(ip))).toEqual({ ok: true });
  });
});
