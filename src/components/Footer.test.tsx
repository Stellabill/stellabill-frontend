import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Footer from "./Footer";

function renderFooter() {
  return render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>
  );
}

describe("Footer", () => {
  // ── Structure ────────────────────────────────────────────────────────────
  it("renders without crashing", () => {
    const { container } = renderFooter();
    expect(container.querySelector("footer")).toBeInTheDocument();
  });

  it("renders the brand tagline", () => {
    renderFooter();
    expect(
      screen.getByText(/Next-generation recurring billing/i)
    ).toBeInTheDocument();
  });

  it("renders all three link sections with their titles", () => {
    renderFooter();
    expect(screen.getByRole("heading", { name: /^Product$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^Resources$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^Legal$/i })).toBeInTheDocument();
  });

  it("renders each product link label", () => {
    renderFooter();
    expect(screen.getByText("Features")).toBeInTheDocument();
    expect(screen.getByText("Pricing")).toBeInTheDocument();
    expect(screen.getByText("Smart Contracts")).toBeInTheDocument();
    expect(screen.getByText("Security")).toBeInTheDocument();
  });

  it("renders each resources link label", () => {
    renderFooter();
    expect(screen.getByText("Documentation")).toBeInTheDocument();
    expect(screen.getByText("API Reference")).toBeInTheDocument();
    expect(screen.getByText("Stellar Network")).toBeInTheDocument();
    expect(screen.getByText("Status Page")).toBeInTheDocument();
  });

  it("renders each legal link label", () => {
    renderFooter();
    expect(screen.getByText("About Us")).toBeInTheDocument();
    expect(screen.getByText("Privacy Policy")).toBeInTheDocument();
    expect(screen.getByText("Terms of Service")).toBeInTheDocument();
    expect(screen.getByText("Cookie Policy")).toBeInTheDocument();
  });

  it("renders the current year in the copyright line", () => {
    renderFooter();
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
  });

  // ── External links ───────────────────────────────────────────────────────
  it("marks external links with target=_blank and rel=noopener noreferrer", () => {
    renderFooter();
    const external = screen.getByRole("link", { name: /Documentation/i });
    expect(external).toHaveAttribute("target", "_blank");
    expect(external).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("internal links do not open in a new tab", () => {
    renderFooter();
    const internal = screen.getByRole("link", { name: /^Pricing$/i });
    expect(internal).not.toHaveAttribute("target", "_blank");
  });

  // ── Newsletter form ──────────────────────────────────────────────────────
  it("renders the newsletter email input", () => {
    renderFooter();
    const input = screen.getByPlaceholderText(/Enter your email/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "email");
  });

  it("updates the email input value when typed", () => {
    renderFooter();
    const input = screen.getByPlaceholderText(/Enter your email/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "test@example.com" } });
    expect(input.value).toBe("test@example.com");
  });

  it("shows the subscribed message after form submission", () => {
    renderFooter();
    const input = screen.getByPlaceholderText(/Enter your email/i);
    fireEvent.change(input, { target: { value: "test@example.com" } });

    const submitButton = input.parentElement!.querySelector("button")!;
    fireEvent.click(submitButton);

    expect(screen.getByText(/Thanks for subscribing/i)).toBeInTheDocument();
  });

  it("clears the email input after successful subscription", () => {
    renderFooter();
    const input = screen.getByPlaceholderText(/Enter your email/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "test@example.com" } });

    const submitButton = input.parentElement!.querySelector("button")!;
    fireEvent.click(submitButton);

    expect(input.value).toBe("");
  });

  it("does not show the subscribed message before submission", () => {
    renderFooter();
    expect(screen.queryByText(/Thanks for subscribing/i)).not.toBeInTheDocument();
  });

  // ── Social icons ─────────────────────────────────────────────────────────
  it("renders the three social icon links", () => {
    const { container } = renderFooter();
    const socialLinks = container.querySelectorAll(
      'a[href="#"]'
    );
    // At least 3 social icons + 2 bottom-bar links
    expect(socialLinks.length).toBeGreaterThanOrEqual(3);
  });

  // ── Bottom bar ───────────────────────────────────────────────────────────
  it("renders the bottom-bar links", () => {
    renderFooter();
    expect(screen.getByText("Security Status")).toBeInTheDocument();
    expect(screen.getByText("Privacy choices")).toBeInTheDocument();
  });
});
