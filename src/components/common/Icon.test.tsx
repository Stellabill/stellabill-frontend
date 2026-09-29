import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Icon } from "./Icon";
import arrow from "../assets/arrow.svg";
import wallet from "../assets/wallet.svg";

describe("Icon RTL Mirroring", () => {
  it('sets data-mirror="always" for always mirrored icons', () => {
    render(<Icon src={arrow} alt="arrow" />);
    const img = screen.getByAltText("arrow");
    expect(img).toHaveAttribute("data-mirror", "always");
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
});
