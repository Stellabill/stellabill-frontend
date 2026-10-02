import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { MockInstance } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import type { ComponentType } from "react";
import TechBadges from "./TechBadges";

/**
 * TechBadges public contract (locked by this suite):
 *
 *   <section aria-label="Technologies used">          -> landmark region
 *     <div>
 *       <a href="https://stellar.org" ...>            -> "Powered by" / "Stellar"
 *       <a href="https://soroban.stellar.org" ...>    -> "Built with" / "Soroban"
 *     </div>
 *   </section>
 *
 * The component is intentionally prop-less and stateless, so the suite covers:
 *   1. the rendered structure, copy, links and a11y wiring (success paths),
 *   2. invalid/unexpected input handling for a prop-less component (failure paths),
 *   3. the state transitions that actually exist: mount -> rerender, mount ->
 *      focus movement -> unmount, mount -> unmount -> remount, and StrictMode
 *      double-invocation.
 */

type Badge = {
  href: string;
  /** Accessible name comes from the anchor's aria-label (name from author). */
  name: string;
  eyebrow: string;
  label: string;
};

const BADGES: Badge[] = [
  {
    href: "https://stellar.org",
    name: "Powered by Stellar — visit stellar.org",
    eyebrow: "Powered by",
    label: "Stellar",
  },
  {
    href: "https://soroban.stellar.org",
    name: "Built with Soroban — visit soroban.stellar.org",
    eyebrow: "Built with",
    label: "Soroban",
  },
];

const SECTION_NAME = "Technologies used";

const containerText = (container: HTMLElement) => container.textContent ?? "";

/**
 * The component takes no props at all; this permissive alias lets the suite
 * feed it the unexpected/garbage props a caller (or a future refactor) could
 * hand it without abandoning type safety in the test file itself.
 */
const PermissiveTechBadges = TechBadges as unknown as ComponentType<
  Record<string, unknown>
>;

const getRegion = () => screen.getByRole("region", { name: SECTION_NAME });

const getBadge = (badge: Badge) =>
  within(getRegion()).getByRole("link", { name: badge.name });

describe("TechBadges — rendered structure and public contract", () => {
  it('renders a single landmark section named "Technologies used"', () => {
    const { container } = render(<TechBadges />);

    const region = getRegion();

    expect(region.tagName).toBe("SECTION");
    expect(region).toHaveAttribute("aria-label", SECTION_NAME);
    // The landmark is the root element and there is exactly one of them.
    expect(container.firstElementChild).toBe(region);
    expect(screen.getAllByRole("region")).toHaveLength(1);
  });

  it("renders exactly one link per technology badge and nothing else interactive", () => {
    const { container } = render(<TechBadges />);

    expect(screen.getAllByRole("link")).toHaveLength(BADGES.length);
    expect(container.querySelectorAll("a")).toHaveLength(BADGES.length);
    expect(
      container.querySelectorAll(
        'button, input, select, textarea, [role="button"], [tabindex]',
      ),
    ).toHaveLength(0);
  });

  it.each(BADGES)(
    "renders the $label badge with its exact href and safe link attributes",
    (badge) => {
      render(<TechBadges />);

      const link = getBadge(badge);

      expect(link).toHaveAttribute("href", badge.href);
      expect(link).toHaveAttribute("target", "_blank");
      // External links must not leak the opener (reverse tabnabbing guard).
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
      expect(link.getAttribute("rel")?.split(/\s+/)).toEqual(
        expect.arrayContaining(["noopener", "noreferrer"]),
      );
    },
  );

  it.each(BADGES)(
    "renders the $eyebrow $label copy inside its badge",
    (badge) => {
      render(<TechBadges />);

      const link = getBadge(badge);

      expect(within(link).getByText(badge.eyebrow)).toBeInTheDocument();
      expect(within(link).getByText(badge.label)).toBeInTheDocument();
      // Eyebrow is rendered above the label in the stacked text column.
      const [eyebrow, label] = Array.from(link.querySelectorAll("span > span"));
      expect(eyebrow).toHaveTextContent(badge.eyebrow);
      expect(label).toHaveTextContent(badge.label);
    },
  );

  it("renders the badges in a stable, documented order", () => {
    render(<TechBadges />);

    expect(
      screen.getAllByRole("link").map((link) => link.getAttribute("href")),
    ).toEqual(BADGES.map((badge) => badge.href));
  });

  it("gives every badge a distinct accessible name taken from its aria-label", () => {
    const { container } = render(<TechBadges />);

    const links = Array.from(container.querySelectorAll("a"));
    const names = links.map((link) => link.getAttribute("aria-label"));

    expect(names).toEqual(BADGES.map((badge) => badge.name));
    expect(new Set(names).size).toBe(BADGES.length);
    // The accessible name must come from aria-label, not from the visible text
    // (the visible text alone would be ambiguous out of context).
    for (const badge of BADGES) {
      expect(getBadge(badge)).toHaveAccessibleName(badge.name);
    }
  });

  it("renders one decorative, correctly sized icon per badge that adds no accessible name", () => {
    const { container } = render(<TechBadges />);

    const icons = Array.from(container.querySelectorAll("svg"));

    expect(icons).toHaveLength(BADGES.length);
    for (const icon of icons) {
      expect(icon).toHaveAttribute("width", "28");
      expect(icon).toHaveAttribute("height", "28");
      // Icons carry no title/role/aria-label, so they cannot shadow the anchor name.
      expect(icon.querySelector("title")).toBeNull();
      expect(icon).not.toHaveAttribute("role");
      expect(icon).not.toHaveAttribute("aria-label");
    }
    expect(screen.queryAllByRole("img")).toHaveLength(0);
  });

  it("never emits scripting surfaces or inline event-handler attributes", () => {
    const { container } = render(<TechBadges />);

    expect(
      container.querySelectorAll("script, iframe, object, embed, style, link"),
    ).toHaveLength(0);

    const elements = Array.from(container.querySelectorAll("*"));
    const inlineHandlers = elements.flatMap((el) =>
      Array.from(el.attributes)
        .filter((attr) => attr.name.startsWith("on"))
        .map((attr) => attr.name),
    );
    expect(inlineHandlers).toEqual([]);
  });

  it("renders without throwing and produces a non-empty subtree", () => {
    expect(() => render(<TechBadges />)).not.toThrow();
    expect(getRegion().children).toHaveLength(1);
  });
});

describe("TechBadges — invalid and unexpected input handling", () => {
  it("ignores unexpected props without throwing", () => {
    expect(() =>
      render(
        <PermissiveTechBadges
          labels={null}
          badges="not-an-array"
          href={undefined}
        />,
      ),
    ).not.toThrow();

    expect(getRegion()).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(BADGES.length);
  });

  it("does not leak unexpected props onto the rendered DOM", () => {
    const onClick = vi.fn();
    const baseline = render(<TechBadges />);
    const baselineMarkup = baseline.container.innerHTML;
    const baselineStyle = getRegion().getAttribute("style");
    baseline.unmount();

    const { container } = render(
      <PermissiveTechBadges
        className="should-not-apply"
        style={{ color: "rgb(255, 0, 0)" }}
        id="should-not-apply"
        tabIndex={5}
        onClick={onClick}
        href="javascript:alert(1)"
        rel="opener"
        target="_self"
      />,
    );

    const region = getRegion();

    expect(region).not.toHaveAttribute("class");
    expect(region).not.toHaveAttribute("id");
    expect(region).not.toHaveAttribute("tabindex");
    // The component keeps its own intrinsic styles; the caller's style object
    // must not be merged in.
    expect(region).toHaveAttribute("style", baselineStyle);
    expect(region.getAttribute("style")).not.toContain("rgb(255, 0, 0)");
    expect(container.innerHTML).toBe(baselineMarkup);
    for (const link of container.querySelectorAll("a")) {
      // The component's own attributes win over any caller-supplied ones.
      expect(link.getAttribute("href")).not.toMatch(/^javascript:/i);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
    expect(onClick).not.toHaveBeenCalled();
  });

  it("does not render injected children or dangerouslySetInnerHTML markup", () => {
    const { container: withChildren } = render(
      <PermissiveTechBadges>INJECTED-CHILD</PermissiveTechBadges>,
    );
    expect(withChildren.textContent).not.toContain("INJECTED-CHILD");
    expect(containerText(withChildren)).not.toContain("<b>");

    const { container: withHtml } = render(
      <PermissiveTechBadges
        dangerouslySetInnerHTML={{ __html: "<img src=x onerror=alert(1)>" }}
      />,
    );
    expect(withHtml.querySelector("img")).toBeNull();
    expect(containerText(withHtml)).not.toContain("onerror");
  });

  it("treats an empty props object exactly like no props at all", () => {
    const { container: withProps, unmount } = render(<PermissiveTechBadges />);
    const withPropsMarkup = withProps.innerHTML;
    unmount();

    const { container: withoutProps } = render(<TechBadges />);

    expect(withoutProps.innerHTML).toBe(withPropsMarkup);
  });

  it("keeps the documented copy when handed malformed label-like props", () => {
    render(
      <PermissiveTechBadges
        labels={[null, undefined]}
        title={42}
        children={null}
      />,
    );

    for (const badge of BADGES) {
      const link = getBadge(badge);
      expect(within(link).getByText(badge.eyebrow)).toBeInTheDocument();
      expect(within(link).getByText(badge.label)).toBeInTheDocument();
    }
  });
});

describe("TechBadges — state transitions", () => {
  let consoleErrorSpy: MockInstance;
  let consoleWarnSpy: MockInstance;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it("reuses the same DOM node and markup when re-rendered with identical props", () => {
    const { rerender, container } = render(<TechBadges />);
    const regionBefore = getRegion();
    const markupBefore = container.innerHTML;

    rerender(<TechBadges />);

    const regionAfter = getRegion();
    // No remount: the very same node is reused and the output is stable.
    expect(regionAfter).toBe(regionBefore);
    expect(container.innerHTML).toBe(markupBefore);
  });

  it("restores the exact initial markup after an unmount/remount cycle", () => {
    const first = render(<TechBadges />);
    const initialMarkup = first.container.innerHTML;
    first.unmount();

    expect(screen.queryByRole("region", { name: SECTION_NAME })).toBeNull();

    const second = render(<TechBadges />);
    expect(second.container.innerHTML).toBe(initialMarkup);
  });

  it("produces identical markup inside React.StrictMode (double-invoked render)", () => {
    const plain = render(<TechBadges />);
    const plainMarkup = plain.container.innerHTML;
    plain.unmount();

    const strict = render(
      <StrictMode>
        <TechBadges />
      </StrictMode>,
    );

    // StrictMode double-invokes render in development; the output must not drift.
    expect(strict.container.innerHTML).toBe(plainMarkup);
    expect(strict.container.innerHTML).not.toBe("");
  });

  it("moves focus forward through both badges in DOM order and back again", async () => {
    const user = userEvent.setup();
    render(<TechBadges />);
    const [first, second] = screen.getAllByRole("link");

    expect(document.body).toHaveFocus();

    await user.tab();
    expect(first).toHaveFocus();

    await user.tab();
    expect(second).toHaveFocus();

    await user.tab({ shift: true });
    expect(first).toHaveFocus();

    await user.tab({ shift: true });
    expect(document.body).toHaveFocus();
  });

  it("releases focus when unmounted so no stale active element is left behind", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<TechBadges />);

    await user.tab();
    expect(screen.getAllByRole("link")[0]).toHaveFocus();

    unmount();

    expect(document.activeElement).toBe(document.body);
    expect(document.body.querySelector("a")).toBeNull();
  });

  it("does not cancel the default activation of a badge link", () => {
    render(<TechBadges />);
    const [first] = screen.getAllByRole("link");

    // Use an in-document fragment so jsdom can complete the default action
    // (external navigation is not implemented in jsdom) while still proving the
    // component installs no click handler that would preventDefault().
    first.setAttribute("href", "#technologies");

    const clickEvent = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
    });
    const notCancelled = fireEvent(first, clickEvent);

    expect(notCancelled).toBe(true);
    expect(clickEvent.defaultPrevented).toBe(false);
  });

  it("renders two independent instances without sharing state", () => {
    const { container } = render(
      <div>
        <TechBadges />
        <TechBadges />
      </div>,
    );

    const regions = screen.getAllByRole("region", { name: SECTION_NAME });
    expect(regions).toHaveLength(2);
    expect(regions[0].innerHTML).toBe(regions[1].innerHTML);
    expect(container.querySelectorAll("a")).toHaveLength(BADGES.length * 2);
    expect(document.querySelectorAll("[id]")).toHaveLength(0);
  });
});
