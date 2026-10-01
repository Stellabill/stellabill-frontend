import { getVersion, getVersionIds, TOKEN_VERSIONS } from "./tokenVersions";
import type { TokenCategory, TokenEntry, TokenVersion } from "./tokenVersions";

const categories = {
  surface: true,
  text: true,
  border: true,
  brand: true,
  feedback: true,
  shadow: true,
  spacing: true,
  typography: true,
  radius: true,
  "z-index": true,
  component: true,
  status: true,
} satisfies Record<TokenCategory, true>;

const exampleToken: TokenEntry = {
  name: "--color-example",
  value: "#123456",
  category: "brand",
};

const exampleVersion: TokenVersion = {
  id: "example",
  label: "Example release",
  date: "2026-01-01",
  tokens: [exampleToken],
};

function tokenMap(version: TokenVersion): Map<string, TokenEntry> {
  return new Map(version.tokens.map((token) => [token.name, token]));
}

describe("tokenVersions public types and catalog", () => {
  it("represents the complete category contract and typed token/version shapes", () => {
    expect(Object.keys(categories).sort()).toEqual([
      "border",
      "brand",
      "component",
      "feedback",
      "radius",
      "shadow",
      "spacing",
      "status",
      "surface",
      "text",
      "typography",
      "z-index",
    ]);
    expect(exampleToken).toEqual({
      name: "--color-example",
      value: "#123456",
      category: "brand",
    });
    expect(exampleVersion.tokens).toEqual([exampleToken]);
  });

  it("keeps release metadata, ids, and token records well-formed", () => {
    expect(getVersionIds()).toEqual(["v0.0.1", "v0.0.2", "v0.0.3"]);
    expect(new Set(getVersionIds()).size).toBe(TOKEN_VERSIONS.length);

    for (const version of TOKEN_VERSIONS) {
      expect(version.id).toMatch(/^v\d+\.\d+\.\d+$/);
      expect(version.label.length).toBeGreaterThan(0);
      expect(version.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(version.date))).toBe(false);
      expect(version.tokens.length).toBeGreaterThan(0);
      expect(new Set(version.tokens.map((token) => token.name)).size).toBe(
        version.tokens.length,
      );

      for (const token of version.tokens) {
        expect(token.name).toMatch(/^--[\w-]+$/);
        expect(token.value.length).toBeGreaterThan(0);
        expect(token.category in categories).toBe(true);
      }
    }
  });
});

describe("version lookup boundaries", () => {
  it.each(TOKEN_VERSIONS)("returns the matching release for $id", (version) => {
    expect(getVersion(version.id)).toBe(version);
  });

  it.each(["", "v9.9.9", " v0.0.1 ", "unknown"])(
    "returns undefined for invalid id %j",
    (id) => {
      expect(getVersion(id)).toBeUndefined();
    },
  );
});

describe("release snapshot transitions", () => {
  it("records additions and a changed value from v0.0.1 to v0.0.2", () => {
    const before = tokenMap(TOKEN_VERSIONS[0]);
    const after = tokenMap(TOKEN_VERSIONS[1]);

    expect(before.has("--color-surface-overlay")).toBe(false);
    expect(after.get("--color-surface-overlay")).toEqual({
      name: "--color-surface-overlay",
      value: "rgba(255,255,255,0.96)",
      category: "surface",
    });
    expect(before.get("--color-surface-card-hover")?.value).toBe("#f8fafc");
    expect(after.get("--color-surface-card-hover")?.value).toBe("#f1f5f9");
  });

  it("records additions, removals, and changed values from v0.0.2 to v0.0.3", () => {
    const before = tokenMap(TOKEN_VERSIONS[1]);
    const after = tokenMap(TOKEN_VERSIONS[2]);

    expect(before.has("--radius-2xl")).toBe(false);
    expect(after.get("--radius-2xl")?.value).toBe("1.5rem");
    expect(before.has("--radius-xl")).toBe(true);
    expect(after.has("--radius-xl")).toBe(false);
    expect(before.get("--color-brand-primary")?.value).toBe("#067d99");
    expect(after.get("--color-brand-primary")?.value).toBe("#0891b2");
  });
});
