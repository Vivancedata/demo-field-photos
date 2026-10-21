/**
 * Origin allowlist for the one endpoint that costs money.
 *
 * The extract route is meant to be called by this demo's own page, not by
 * scripts elsewhere on the internet spending the Anthropic key. Browsers send
 * `Origin` on every POST (and `Referer` on most), so a request whose origin is
 * not one of this demo's hosts is refused with 403. A determined caller can
 * forge these headers from a server, so this is a cheap filter that sits in
 * front of the per-IP rate limit, not authentication.
 *
 * Allowed:
 * - the production hosts below;
 * - this deployment's own Vercel URLs (VERCEL_URL, VERCEL_BRANCH_URL,
 *   VERCEL_PROJECT_PRODUCTION_URL), so preview deployments work;
 * - any extra hosts in ALLOWED_ORIGINS (comma-separated hostnames);
 * - localhost / 127.0.0.1 when NODE_ENV is not "production" (`next dev`).
 */
const PRODUCTION_HOSTS = ["field.vivancedata.com", "demo-field-photos.vercel.app"];

function allowedHosts(): Set<string> {
  const hosts = new Set<string>(PRODUCTION_HOSTS);
  for (const v of [
    process.env.VERCEL_URL,
    process.env.VERCEL_BRANCH_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    ...(process.env.ALLOWED_ORIGINS ?? "").split(","),
  ]) {
    const host = v?.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "").toLowerCase();
    if (host) hosts.add(host);
  }
  return hosts;
}

function hostOf(value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).host.toLowerCase();
  } catch {
    return null;
  }
}

export function isAllowedOrigin(request: Request): boolean {
  const host =
    hostOf(request.headers.get("origin")) ?? hostOf(request.headers.get("referer"));
  if (!host) return false;

  if (process.env.NODE_ENV !== "production") {
    const hostname = host.replace(/:\d+$/, "");
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]") {
      return true;
    }
  }
  return allowedHosts().has(host);
}
