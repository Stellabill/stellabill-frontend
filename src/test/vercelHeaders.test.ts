import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";

type VercelHeader = { key: string; value: string };
type VercelHeaderRule = { source: string; headers: VercelHeader[] };
type VercelConfig = { headers?: VercelHeaderRule[] };

function loadVercelConfig(): VercelConfig {
  const configPath = resolve(__dirname, "../../vercel.json");
  return JSON.parse(readFileSync(configPath, "utf-8")) as VercelConfig;
}

function getHeadersForAllRoutes(config: VercelConfig): Record<string, string> {
  const rule = (config.headers ?? []).find((entry) => entry.source === "/(.*)");
  if (!rule) {
    throw new Error('Expected a headers rule with source "/(.*)" in vercel.json');
  }
  return Object.fromEntries(rule.headers.map((h) => [(h.key.toLowerCase()), h.value]));
}

describe("vercel.json security headers", () => {
  const config = loadVercelConfig();
  const headers = getHeadersForAllRoutes(config);

  it("declares a headers block for all routes", () => {
    expect(config.headers?.length).toBeGreaterThan(0);
  });

  it("enforces a Content-Security-Policy with frame-ancestors 'none'", () => {
    const csp = headers["content-security-policy"];
    expect(csp).toBeTruthy();
    expect(csp).not.toMatch(/Report-Only/i);
    expect(csp).toMatch(/default-src 'self'/);
    expect(csp).toMatch(/frame-ancestors 'none'/);
    expect(csp).toMatch(/object-src 'none'/);
    expect(csp).toMatch(/base-uri 'self'/);
    expect(csp).toMatch(/style-src[^;]*https:\/\/fonts\.googleapis\.com/);
    expect(csp).toMatch(/font-src[^;]*https:\/\/fonts\.gstatic\.com/);
    expect(csp).toMatch(/connect-src/);
  });

  it("blocks framing via X-Frame-Options", () => {
    expect(headers["x-frame-options"].toUpperCase()).toBe("DENY");
  });

  it("sets X-Content-Type-Options: nosniff", () => {
    expect(headers["x-content-type-options"].toLowerCase()).toBe("nosniff");
  });

  it("sets Referrer-Policy: strict-origin-when-cross-origin", () => {
    expect(headers["referrer-policy"].toLowerCase()).toBe("strict-origin-when-cross-origin");
  });

  it("disables camera, microphone and geolocation via Permissions-Policy", () => {
    const policy = headers["permissions-policy"];
    expect(policy).toBeTruthy();
    expect(policy).toMatch(/camera=\(\)/);
    expect(policy).toMatch(/microphone=\(\)/);
    expect(policy).toMatch(/geolocation=\(\)/);
  });
});
