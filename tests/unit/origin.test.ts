import { describe, expect, it, vi } from "vitest";
import { isAllowedOrigin } from "@/lib/origin";

const PROD_HOST = "field.vivancedata.com";

function req(headers: Record<string, string>): Request {
  return new Request("http://internal/api/extract", { method: "POST", headers });
}

describe("isAllowedOrigin", () => {
  it("allows the production hosts", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(isAllowedOrigin(req({ origin: `https://${PROD_HOST}` }))).toBe(true);
    expect(isAllowedOrigin(req({ origin: "https://demo-field-photos.vercel.app" }))).toBe(true);
  });

  it("refuses unknown origins and requests with no origin or referer", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(isAllowedOrigin(req({ origin: "https://evil.example" }))).toBe(false);
    expect(isAllowedOrigin(req({}))).toBe(false);
    expect(isAllowedOrigin(req({ origin: "not a url" }))).toBe(false);
  });

  it("does not treat a lookalike suffix as the production host", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(isAllowedOrigin(req({ origin: `https://${PROD_HOST}.evil.example` }))).toBe(false);
    expect(isAllowedOrigin(req({ origin: `https://evil-${PROD_HOST}` }))).toBe(false);
  });

  it("falls back to Referer when Origin is missing or opaque", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(isAllowedOrigin(req({ referer: `https://${PROD_HOST}/some/page?x=1` }))).toBe(true);
    expect(isAllowedOrigin(req({ origin: "null", referer: `https://${PROD_HOST}/` }))).toBe(true);
  });

  it("allows this deployment's Vercel URLs and ALLOWED_ORIGINS", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_URL", "demo-git-abc.vercel.app");
    vi.stubEnv("ALLOWED_ORIGINS", " https://Demo.Example.com/path , other.example ");
    expect(isAllowedOrigin(req({ origin: "https://demo-git-abc.vercel.app" }))).toBe(true);
    expect(isAllowedOrigin(req({ origin: "https://demo.example.com" }))).toBe(true);
    expect(isAllowedOrigin(req({ origin: "https://other.example" }))).toBe(true);
  });

  it("allows localhost only outside production", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(isAllowedOrigin(req({ origin: "http://localhost:3000" }))).toBe(true);
    expect(isAllowedOrigin(req({ origin: "http://127.0.0.1:3000" }))).toBe(true);
    expect(isAllowedOrigin(req({ origin: "http://[::1]:3000" }))).toBe(true);

    vi.stubEnv("NODE_ENV", "production");
    expect(isAllowedOrigin(req({ origin: "http://localhost:3000" }))).toBe(false);
  });
});
