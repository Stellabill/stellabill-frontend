import { render, screen } from "@testing-library/react";
import { afterEach, describe, it, expect, vi } from "vitest";
import { Icon, type IconName } from "./Icon";
import arrow from "../assets/arrow.svg";
import wallet from "../assets/wallet.svg";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Icon (Image source & RTL Mirroring)", () => {
  it('sets data-mirror="always" for always mirrored icons', () => {
    render(<Icon src={arrow} alt="arrow" />);
    const img = screen.getByAltText("arrow");
    expect(img).toHaveAttribute("data-mirror", "always");
    expect(img).not.toHaveAttribute("aria-hidden");
  });

  it('sets data-mirror="never" for never mirrored icons', () => {
    render(<Icon src={wallet} alt="wallet" />);
    const img = screen.getByAltText("wallet");
    expect(img).toHaveAttribute("data-mirror", "never");
  });

  it("does not mirror an unregistered icon and preserves its source", () => {
    render(<Icon src="/assets/unregistered.svg?version=1" alt="unknown" />);
    const img = screen.getByAltText("unknown");
    expect(img).toHaveAttribute("data-mirror", "never");
    expect(img).toHaveAttribute("src", "/assets/unregistered.svg?version=1");
  });

  it("does not mirror an icon with an empty source", () => {
    render(<Icon src="" alt="empty icon" />);
    const img = screen.getByAltText("empty icon");
    expect(img).toHaveAttribute("data-mirror", "never");
    expect(img).toHaveAttribute("src", "");
  });

  it("applies custom classes along with base class", () => {
    render(<Icon src={arrow} alt="arrow" className="custom-class" />);
    const img = screen.getByAltText("arrow");
    expect(img).toHaveClass("stellabill-icon custom-class");
  });

  it("marks decorative image icons as aria-hidden when no label or alt is passed", () => {
    const { container } = render(<Icon src={arrow} />);
    const img = container.querySelector("img");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("aria-hidden", "true");
    expect(img).toHaveAttribute("alt", "");
  });

  it("exposes image icons to assistive tech when label is passed", () => {
    render(<Icon src={arrow} label="Next step" size={24} />);
    const img = screen.getByRole("img", { name: "Next step" });
    expect(img).not.toHaveAttribute("aria-hidden");
    expect(img).toHaveAttribute("width", "24");
    expect(img).toHaveAttribute("height", "24");
  });
});

describe("Icon (Lucide name lookup)", () => {
  it("renders the given Lucide icon", () => {
    const { container } = render(<Icon name="Users" size={24} color="red" />);
    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute("width", "24");
    expect(icon).toHaveAttribute("stroke", "red");
  });

  it("renders icons with the default props and aria-hidden when no label is passed", () => {
    const { container } = render(<Icon name="Users" />);
    const icon = container.querySelector("svg");

    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute("width", "20");
    expect(icon).toHaveAttribute("stroke", "currentColor");
    expect(icon).toHaveAttribute("stroke-width", "2");
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon).not.toHaveAttribute("role");
  });

  it("exposes Lucide icon with role=img and aria-label when label is passed", () => {
    render(<Icon name="Download" label="Export data" />);
    const icon = screen.getByRole("img", { name: "Export data" });
    expect(icon).toBeInTheDocument();
    expect(icon).not.toHaveAttribute("aria-hidden");
  });

  it.each(["InvalidIcon", "", undefined])(
    "renders nothing and warns for an unresolved name: %s",
    (name) => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { container } = render(<Icon name={name as IconName} />);

      expect(container.firstChild).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Icon "' + name + '" not found in lucide-react'
      );
    }
  );
});
