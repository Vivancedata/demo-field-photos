/**
 * Per-IP rate limit for the one endpoint that costs money.
 *
 * In-memory on purpose: on Vercel's fluid compute an instance serves many
 * requests, so this damps abuse well enough for a demo without adding a
 * store. It is NOT a billing guarantee -- a cold start or a second instance
 * resets the counter -- it only makes running up the bill boring. If a demo
 * ever grows real traffic, move this to a shared store.
 */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 10;

const hits = new Map<string, { count: number; windowStart: number }>();

export function rateLimit(request: Request): { ok: true } | { ok: false; retryAfterSec: number } {
  // Vercel sets x-forwarded-for; first hop is the client.
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const now = Date.now();
  const entry = hits.get(ip);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    hits.set(ip, { count: 1, windowStart: now });
    return { ok: true };
  }
  entry.count += 1;
  if (entry.count > MAX_PER_WINDOW) {
    return { ok: false, retryAfterSec: Math.ceil((entry.windowStart + WINDOW_MS - now) / 1000) };
  }
  return { ok: true };
}
