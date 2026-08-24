/**
 * ChartPalette.stories.tsx — issue #314
 *
 * Storybook page demonstrating:
 *   - All 8 series colours in light and dark mode
 *   - Swatch table with token names, hex values, and contrast ratios
 *   - Series overlap simulation (multiple lines on one chart)
 *   - Heatmap colour ramp (CohortRetentionChart palette)
 *   - Sparkline primitive in both palettes
 *   - Colorblind simulation guidance note
 */

import type { Meta, StoryObj } from "@storybook/react";
import { CHART_PALETTE, SPARKLINE_DEFAULT_COLOR, resolveHeatmapBand, seriesVar } from "@/tokens/chartPalette";
import Sparkline from "@/components/common/Sparkline";
import { LineChart } from "@/components/RevenueChart";
import type { SeriesData } from "@/components/RevenueChart";

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

const SWATCH_SIZE = 40;

function ContrastBadge({ level }: { level: string }) {
  const isPass = level !== "Fail";
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 6px",
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 700,
        backgroundColor: isPass ? "rgba(52,211,153,0.18)" : "rgba(248,113,113,0.18)",
        color: isPass ? "#34d399" : "#f87171",
        fontFamily: "monospace",
      }}
    >
      {level}
    </span>
  );
}

/* ─── Palette Swatch Table component ──────────────────────────────────────── */

function PaletteSwatchTable({ theme }: { theme: "light" | "dark" }) {
  const surface = theme === "dark" ? "#00060f" : "#f8fafc";
  const surfaceLabel = theme === "dark" ? "#00060f (dark canvas)" : "#f8fafc (light canvas)";
  const textColor = theme === "dark" ? "#f8fafc" : "#0f172a";
  const borderColor = theme === "dark" ? "rgba(148,163,184,0.18)" : "#e2e8f0";
  const headerBg = theme === "dark" ? "rgba(148,163,184,0.10)" : "#f1f5f9";

  return (
    <div
      style={{
        backgroundColor: surface,
        borderRadius: 12,
        padding: 24,
        border: `1px solid ${borderColor}`,
      }}
    >
      <h3
        style={{
          margin: "0 0 4px",
          fontSize: 16,
          fontWeight: 700,
          color: textColor,
          textTransform: "capitalize",
        }}
      >
        {theme} mode palette
      </h3>
      <p style={{ margin: "0 0 20px", fontSize: 13, color: theme === "dark" ? "#94a3b8" : "#64748b" }}>
        Surface: <code style={{ fontFamily: "monospace" }}>{surfaceLabel}</code>
      </p>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 13,
          color: textColor,
        }}
        aria-label={`Chart series palette swatches — ${theme} mode`}
      >
        <thead>
          <tr style={{ backgroundColor: headerBg }}>
            <th style={{ padding: "8px 12px", textAlign: "left", borderBottom: `1px solid ${borderColor}` }}>#</th>
            <th style={{ padding: "8px 12px", textAlign: "left", borderBottom: `1px solid ${borderColor}` }}>Swatch</th>
            <th style={{ padding: "8px 12px", textAlign: "left", borderBottom: `1px solid ${borderColor}` }}>Token</th>
            <th style={{ padding: "8px 12px", textAlign: "left", borderBottom: `1px solid ${borderColor}` }}>Hex</th>
            <th style={{ padding: "8px 12px", textAlign: "left", borderBottom: `1px solid ${borderColor}` }}>Label</th>
            <th style={{ padding: "8px 12px", textAlign: "left", borderBottom: `1px solid ${borderColor}` }}>CR vs surface</th>
            <th style={{ padding: "8px 12px", textAlign: "left", borderBottom: `1px solid ${borderColor}` }}>WCAG</th>
          </tr>
        </thead>
        <tbody>
          {CHART_PALETTE.map((swatch, i) => {
            const hex = theme === "dark" ? swatch.dark : swatch.light;
            const cr = theme === "dark" ? swatch.contrastDark : swatch.contrastLight;
            const level = theme === "dark" ? swatch.wcagDark : swatch.wcagLight;
            return (
              <tr key={swatch.token} style={{ borderBottom: `1px solid ${borderColor}` }}>
                <td style={{ padding: "10px 12px", fontVariantNumeric: "tabular-nums" }}>{i + 1}</td>
                <td style={{ padding: "10px 12px" }}>
                  <div
                    style={{
                      width: SWATCH_SIZE,
                      height: SWATCH_SIZE,
                      borderRadius: 6,
                      backgroundColor: hex,
                      border: `1px solid ${borderColor}`,
                    }}
                    title={hex}
                    aria-label={`Colour swatch ${hex}`}
                  />
                </td>
                <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: 12 }}>
                  {swatch.token}
                </td>
                <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: 12 }}>
                  {hex}
                </td>
                <td style={{ padding: "10px 12px" }}>{swatch.label}</td>
                <td style={{ padding: "10px 12px", fontVariantNumeric: "tabular-nums" }}>
                  {cr.toFixed(2)}:1
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <ContrastBadge level={level} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Heatmap Ramp component ──────────────────────────────────────────────── */

function HeatmapRamp({ theme }: { theme: "light" | "dark" }) {
  const isDark = theme === "dark";
  const surface = isDark ? "#00060f" : "#f8fafc";
  const borderColor = isDark ? "rgba(148,163,184,0.18)" : "#e2e8f0";
  const textColor = isDark ? "#f8fafc" : "#0f172a";
  const mutedColor = isDark ? "#94a3b8" : "#64748b";

  const samplePcts = [0, 10, 30, 50, 70, 90, 100];

  return (
    <div
      style={{
        backgroundColor: surface,
        borderRadius: 12,
        padding: 24,
        border: `1px solid ${borderColor}`,
      }}
    >
      <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: textColor, textTransform: "capitalize" }}>
        {theme} mode — heatmap ramp
      </h3>
      <p style={{ margin: "0 0 16px", fontSize: 13, color: mutedColor }}>
        CohortRetentionChart intensity palette (0 → 100% retention)
      </p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "flex-end" }}>
        {samplePcts.map((pct) => {
          const style = resolveHeatmapBand(pct, isDark);
          return (
            <div
              key={pct}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 4,
                  border: `1px solid ${borderColor}`,
                  ...style,
                }}
                title={`${pct}%`}
                aria-label={`Heatmap band at ${pct}%`}
              />
              <span style={{ fontSize: 11, color: mutedColor, fontFamily: "monospace" }}>
                {pct}%
              </span>
            </div>
          );
        })}
        {/* Null cell */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 4,
              border: `1px solid ${borderColor}`,
              ...resolveHeatmapBand(null, isDark),
            }}
            title="null"
            aria-label="Heatmap null/missing cell"
          />
          <span style={{ fontSize: 11, color: mutedColor, fontFamily: "monospace" }}>
            null
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Series Overlap component ────────────────────────────────────────────── */

const buildOverlapSeries = (): SeriesData[] =>
  CHART_PALETTE.map((swatch, i) => ({
    id: `series-${i + 1}`,
    name: `Series ${i + 1}`,
    color: seriesVar(i),
    visible: true,
    data: Array.from({ length: 12 }, (_, j) => ({
      date: `M${j + 1}`,
      revenue: Math.round(200 + Math.sin((j + i * 1.5) * 0.7) * 150 + i * 50),
    })),
  }));

/* ─── Sparkline Row ───────────────────────────────────────────────────────── */

const sparkData = [10, 25, 18, 40, 35, 55, 48, 70, 62, 85];

function SparklineRow({ theme }: { theme: "light" | "dark" }) {
  const surface = theme === "dark" ? "#00060f" : "#f8fafc";
  const borderColor = theme === "dark" ? "rgba(148,163,184,0.18)" : "#e2e8f0";
  const textColor = theme === "dark" ? "#f8fafc" : "#0f172a";
  const mutedColor = theme === "dark" ? "#94a3b8" : "#64748b";

  return (
    <div
      style={{
        backgroundColor: surface,
        borderRadius: 12,
        padding: 24,
        border: `1px solid ${borderColor}`,
      }}
    >
      <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: textColor, textTransform: "capitalize" }}>
        {theme} mode — Sparkline primitives
      </h3>
      <p style={{ margin: "0 0 16px", fontSize: 13, color: mutedColor }}>
        Default: <code style={{ fontFamily: "monospace" }}>{SPARKLINE_DEFAULT_COLOR}</code>; overrides use explicit series vars.
      </p>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
        {CHART_PALETTE.slice(0, 5).map((swatch, i) => (
          <div key={swatch.token} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <Sparkline
              data={sparkData}
              width={100}
              height={36}
              color={seriesVar(i)}
              aria-label={`Sparkline series ${i + 1}`}
            />
            <span style={{ fontSize: 11, color: mutedColor, fontFamily: "monospace" }}>
              series-{i + 1}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Meta ────────────────────────────────────────────────────────────────── */

const meta: Meta = {
  title: "Design System/Chart Palette",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `
## Dark-Mode Chart Palette — issue #314

An 8-colour categorical chart palette with **light** and **dark** variants.
All colours meet **WCAG 2.1 §1.4.11 Non-text Contrast AA (≥ 3:1)** against the
relevant \`--color-surface-canvas\` token.

### Tokens
Defined in \`src/tokens/chartPalette.ts\` and reflected in \`src/styles/tokens.css\`
under \`:root / [data-theme="light"]\` and \`@media (prefers-color-scheme: dark) / [data-theme="dark"]\`.

### Components using this palette
- \`RevenueChart\` — uses \`seriesVar(index)\` for per-series CSS vars
- \`CohortRetentionChart\` — uses \`resolveHeatmapBand(pct, isDark)\` for heatmap cells
- \`Sparkline\` — default \`color\` prop set to \`SPARKLINE_DEFAULT_COLOR\`

### Colorblind safety
- Series 1–4 (blue, orange, emerald, pink) are safe for **deuteranopia / protanopia**
  (hue + lightness separation maintained under Brettel simulation).
- Hidden series fall back to dashed strokes + fill hatching as a non-colour differentiator.
        `,
      },
    },
    a11y: {
      config: {
        rules: [
          // We intentionally test graphical/non-text elements; text contrast
          // rules don't apply to the swatch cells.
          { id: "color-contrast", enabled: false },
        ],
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/* ─── Stories ─────────────────────────────────────────────────────────────── */

export const LightModePalette: Story = {
  name: "Light Mode — Swatch Table",
  render: () => <PaletteSwatchTable theme="light" />,
  parameters: {
    backgrounds: { default: "light" },
    docs: {
      description: { story: "All 8 series colours in light mode with token names, hex values, contrast ratios, and WCAG levels." },
    },
  },
};

export const DarkModePalette: Story = {
  name: "Dark Mode — Swatch Table",
  render: () => <PaletteSwatchTable theme="dark" />,
  parameters: {
    backgrounds: { default: "dark" },
    docs: {
      description: { story: "All 8 series colours in dark mode. Higher lightness/chroma ensures clear series distinction on deep-dark surfaces (canvas: #00060f)." },
    },
  },
};

export const BothPalettes: Story = {
  name: "Both Palettes — Side by Side",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, padding: 24 }}>
      <PaletteSwatchTable theme="light" />
      <PaletteSwatchTable theme="dark" />
    </div>
  ),
  parameters: {
    docs: {
      description: { story: "Light and dark palettes side by side for easy before/after comparison." },
    },
  },
};

export const HeatmapRamps: Story = {
  name: "Heatmap Colour Ramps",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, padding: 24 }}>
      <HeatmapRamp theme="light" />
      <HeatmapRamp theme="dark" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "CohortRetentionChart heatmap intensity ramp from 0→100% retention. Null cells use a neutral background. Each band passes ≥ 3:1 contrast against its surface.",
      },
    },
  },
};

export const SeriesOverlap8: Story = {
  name: "Series Overlap — All 8 Series",
  render: () => {
    const overlapSeries = buildOverlapSeries();
    const data = overlapSeries[0].data;
    return (
      <div style={{ padding: 24 }}>
        <p style={{ margin: "0 0 12px", fontSize: 13, color: "#94a3b8" }}>
          All 8 series rendered simultaneously to verify visual separation. Each line uses its
          CSS variable colour so toggling <code>[data-theme]</code> on the HTML element
          switches the whole palette.
        </p>
        <LineChart data={data} series={overlapSeries} />
        <p style={{ margin: "12px 0 0", fontSize: 12, color: "#64748b" }}>
          <strong>Colorblind note:</strong> Series 1–4 (blue, amber, emerald, pink) are safe
          for deuteranopia. Series 5–8 provide additional lightness steps. Patterns (dashes)
          differentiate hidden series.
        </p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Stress-tests the palette by rendering all 8 series together. Verify that no two adjacent lines look identical at a glance, including under colorblind simulation.",
      },
    },
  },
};

export const SparklinePrimitives: Story = {
  name: "Sparkline Primitives",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, padding: 24 }}>
      <SparklineRow theme="light" />
      <SparklineRow theme="dark" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Sparkline component using series CSS variables. The default colour token is `var(--chart-series-1)` which automatically switches between light and dark values.",
      },
    },
  },
};

export const ColorblindSimulation: Story = {
  name: "Colorblind Simulation Guidance",
  render: () => {
    const surface = "#f8fafc";
    const pairs: Array<[number, number, string]> = [
      [0, 2, "Blue vs Emerald (safe for deuteranopia — different hue + lightness)"],
      [0, 1, "Blue vs Orange (safe for protanopia — blue/amber polarity)"],
      [3, 4, "Pink vs Violet (distinguish via lightness; also use pattern fallback)"],
      [5, 7, "Yellow vs Mint (high lightness contrast on dark; medium on light)"],
    ];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 24 }}>
        <div
          style={{
            backgroundColor: "#1e293b",
            borderRadius: 8,
            padding: 16,
            color: "#e2e8f0",
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          <strong>How to verify colorblind safety:</strong>
          <ol style={{ margin: "8px 0 0 16px", padding: 0 }}>
            <li>Open in Chrome DevTools → Rendering → Emulate vision deficiency.</li>
            <li>Test: Deuteranopia, Protanopia, Tritanopia, Achromatopsia.</li>
            <li>Confirm each series pair below remains distinguishable.</li>
          </ol>
        </div>
        <div
          style={{ backgroundColor: surface, borderRadius: 12, padding: 24, border: "1px solid #e2e8f0" }}
        >
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
            Pair Analysis — Light Mode
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {pairs.map(([a, b, desc]) => {
              const hexA = CHART_PALETTE[a].light;
              const hexB = CHART_PALETTE[b].light;
              return (
                <div
                  key={`${a}-${b}`}
                  style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13 }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 4, backgroundColor: hexA, border: "1px solid #e2e8f0" }} />
                  <span style={{ color: "#475569", fontSize: 12 }}>vs</span>
                  <div style={{ width: 36, height: 36, borderRadius: 4, backgroundColor: hexB, border: "1px solid #e2e8f0" }} />
                  <span style={{ color: "#334155" }}>{desc}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Guidance for verifying colorblind safety. Use Chrome DevTools vision-deficiency emulation to test each pair under deuteranopia, protanopia, and tritanopia.",
      },
    },
  },
};
