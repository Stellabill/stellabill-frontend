import { useMemo, useState } from "react";
import { Check, Clipboard, Search } from "lucide-react";
import { copyToClipboard } from "../utils/clipboard";
import "./DesignTokens.css";

type TokenCategory = "Colors" | "Spacing" | "Typography" | "Motion";

type Token = {
  name: string;
  value: string;
  category: TokenCategory;
  role: string;
  usage: string;
  sample?: string;
};

const tokens: Token[] = [
  { name: "--color-brand-primary", value: "#067d99", category: "Colors", role: "Primary action color", usage: "Use for primary buttons, active links, and key product moments." },
  { name: "--color-brand-accent", value: "#0f766e", category: "Colors", role: "Secondary brand accent", usage: "Pair with primary brand for gradients, highlights, and supporting emphasis." },
  { name: "--color-surface-canvas", value: "#f8fafc", category: "Colors", role: "App canvas", usage: "Default page canvas behind panels and dense product views." },
  { name: "--color-surface-card", value: "#ffffff", category: "Colors", role: "Card surface", usage: "Use for repeated cards, form panels, menus, and raised content blocks." },
  { name: "--color-text-primary", value: "#0f172a", category: "Colors", role: "Primary text", usage: "Use for headings, labels, table values, and body copy that must scan quickly." },
  { name: "--color-text-muted", value: "#475569", category: "Colors", role: "Muted text", usage: "Use for metadata, hints, helper text, and lower-priority UI copy." },
  { name: "--color-border-subtle", value: "#e2e8f0", category: "Colors", role: "Subtle divider", usage: "Use for table rules, card dividers, and low-emphasis boundaries." },
  { name: "--color-focus-ring", value: "#0891b2", category: "Colors", role: "Keyboard focus", usage: "Use through focus styles only; never remove without a replacement indicator." },
  { name: "--color-success", value: "#047857", category: "Colors", role: "Success state", usage: "Use with success background and border tokens for complete status messaging." },
  { name: "--color-warning", value: "#b45309", category: "Colors", role: "Warning state", usage: "Use for recoverable billing and validation states that need attention." },
  { name: "--color-danger", value: "#b91c1c", category: "Colors", role: "Danger state", usage: "Use for destructive actions, failed payments, and irreversible warnings." },
  { name: "--space-1", value: "0.25rem", category: "Spacing", role: "4px step", usage: "Use for compact internal icon gaps and tight control spacing." },
  { name: "--space-2", value: "0.5rem", category: "Spacing", role: "8px step", usage: "Use for small inline gaps and compact vertical rhythm." },
  { name: "--space-4", value: "1rem", category: "Spacing", role: "16px step", usage: "Use as the default gap between related form fields and controls." },
  { name: "--space-6", value: "1.5rem", category: "Spacing", role: "24px step", usage: "Use between panels, card content groups, and page subsections." },
  { name: "--space-12", value: "3rem", category: "Spacing", role: "48px step", usage: "Use for major section separation in product pages." },
  { name: "--space-section", value: "clamp(3rem, 6vw, 6rem)", category: "Spacing", role: "Responsive section gap", usage: "Use for large vertical page rhythm that must scale across viewports." },
  { name: "--text-xs", value: "clamp(0.694rem, 0.67rem + 0.12vw, 0.75rem)", category: "Typography", role: "Caption and labels", usage: "Use for captions, metadata, badges, and short uppercase labels." },
  { name: "--text-base", value: "clamp(1rem, 0.95rem + 0.25vw, 1.125rem)", category: "Typography", role: "Default body", usage: "Use for standard body text and form copy." },
  { name: "--text-3xl", value: "clamp(1.602rem, 1.43rem + 0.86vw, 2.441rem)", category: "Typography", role: "Section heading", usage: "Use for dashboard section titles and important empty states." },
  { name: "--font-family-display", value: "'Sora', 'DM Sans', sans-serif", category: "Typography", role: "Display font stack", usage: "Use for headings, hero labels, and high-emphasis product titles." },
  { name: "--leading-normal", value: "1.5", category: "Typography", role: "Default line height", usage: "Use for readable product body copy and form descriptions." },
  { name: "--motion-duration-fast", value: "120ms", category: "Motion", role: "Fast feedback", usage: "Use for hover, press, and focus feedback that should feel immediate." },
  { name: "--motion-duration-base", value: "180ms", category: "Motion", role: "Default transition", usage: "Use for common control, panel, and color transitions." },
  { name: "--motion-duration-slow", value: "260ms", category: "Motion", role: "Large transition", usage: "Use for larger panels, overlays, and layout changes." },
  { name: "--motion-easing-standard", value: "cubic-bezier(0.2, 0, 0, 1)", category: "Motion", role: "Standard easing", usage: "Use for most enter, exit, and state transitions." },
];

const categories: TokenCategory[] = ["Colors", "Spacing", "Typography", "Motion"];

function getSample(token: Token) {
  return token.sample ?? `var(${token.name})`;
}

export default function DesignTokens() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<TokenCategory | "All">("All");
  const [copyState, setCopyState] = useState<Record<string, "copied" | "failed">>({});

  const filteredTokens = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return tokens.filter((token) => {
      const matchesCategory = activeCategory === "All" || token.category === activeCategory;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [token.name, token.value, token.role, token.usage, token.category]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, query]);

  const handleCopy = async (token: Token) => {
    const succeeded = await copyToClipboard(getSample(token));
    setCopyState((current) => ({ ...current, [token.name]: succeeded ? "copied" : "failed" }));
    window.setTimeout(() => {
      setCopyState((current) => {
        const next = { ...current };
        delete next[token.name];
        return next;
      });
    }, 1800);
  };

  return (
    <main className="design-tokens" aria-labelledby="design-tokens-title">
      <header className="design-tokens__header">
        <div>
          <p className="design-tokens__eyebrow">Design system</p>
          <h1 id="design-tokens-title">Design tokens</h1>
          <p>
            Searchable reference for Stellabill color, spacing, typography, and motion tokens with
            usage guidance and copy-ready CSS samples.
          </p>
        </div>
      </header>

      <section className="design-tokens__toolbar" aria-label="Token filters">
        <label className="design-tokens__search">
          <Search aria-hidden="true" size={18} />
          <span className="sr-only">Search tokens</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search token, value, or usage"
            type="search"
          />
        </label>

        <div className="design-tokens__segments" role="group" aria-label="Token categories">
          {(["All", ...categories] as const).map((category) => (
            <button
              key={category}
              type="button"
              aria-pressed={activeCategory === category}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <section className="design-tokens__summary" aria-label="Token documentation contract">
        <div>
          <strong>{filteredTokens.length}</strong>
          <span>matching tokens</span>
        </div>
        <div>
          <strong>{categories.length}</strong>
          <span>documented groups</span>
        </div>
        <div>
          <strong>CSS var</strong>
          <span>stable copy contract</span>
        </div>
      </section>

      {filteredTokens.length === 0 ? (
        <section className="design-tokens__empty" role="status">
          <h2>No matching tokens</h2>
          <p>Try a token name, CSS value, category, or usage phrase.</p>
        </section>
      ) : (
        <section className="design-tokens__grid" aria-label="Token results">
          {filteredTokens.map((token) => {
            const copyStatus = copyState[token.name];
            const isColor = token.category === "Colors";
            return (
              <article className="design-token-card" key={token.name}>
                <div className="design-token-card__preview" aria-hidden="true">
                  {isColor ? (
                    <span style={{ background: `var(${token.name})` }} />
                  ) : (
                    <code>{token.category}</code>
                  )}
                </div>
                <div className="design-token-card__body">
                  <div>
                    <p className="design-token-card__category">{token.category}</p>
                    <h2>{token.name}</h2>
                    <p>{token.role}</p>
                  </div>
                  <dl>
                    <div>
                      <dt>Value</dt>
                      <dd>{token.value}</dd>
                    </div>
                    <div>
                      <dt>Use</dt>
                      <dd>{token.usage}</dd>
                    </div>
                  </dl>
                  <button type="button" onClick={() => handleCopy(token)}>
                    {copyStatus === "copied" ? <Check size={16} aria-hidden="true" /> : <Clipboard size={16} aria-hidden="true" />}
                    {copyStatus === "failed" ? "Copy failed" : copyStatus === "copied" ? "Copied" : getSample(token)}
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
