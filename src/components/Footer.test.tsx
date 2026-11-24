import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Footer from "./Footer";
import { DOCS_URL, GITHUB_REPO_URL, SUPPORT_URL, DEMO_URL } from "../config/links";

vi.mock("../config/links", () => ({
  DOCS_URL: "https://custom.example.com/docs",
  GITHUB_REPO_URL: "https://custom.example.com/repo",
  SUPPORT_URL: "https://custom.example.com/support",
  DEMO_URL: "https://custom.example.com/demo",
}));

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
    expect(screen.getByText("Dashboard (demo)")).toBeInTheDocument();
    expect(screen.getByText("Browse plans")).toBeInTheDocument();
  });

  it("renders each resources link label", () => {
    renderFooter();
    expect(screen.getByText("Documentation")).toBeInTheDocument();
    expect(screen.getByText("Source code")).toBeInTheDocument();
    expect(screen.getByText("Stellar Network")).toBeInTheDocument();
    expect(screen.getByText("Report an issue")).toBeInTheDocument();
  });

  it("renders each legal link label", () => {
    renderFooter();
    expect(screen.getByText("About prepaid balances")).toBeInTheDocument();
    expect(screen.getByText("Brand pack")).toBeInTheDocument();
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

  it("uses DOCS_URL for Documentation link", () => {
    renderFooter();
    expect(screen.getByRole("link", { name: /Documentation/i })).toHaveAttribute(
      "href",
      DOCS_URL
    );
  });

  it("uses GITHUB_REPO_URL for Source code and GitHub social links", () => {
    renderFooter();
    expect(screen.getByRole("link", { name: /Source code/i })).toHaveAttribute(
      "href",
      GITHUB_REPO_URL
    );
    expect(screen.getByRole("link", { name: /Stellabill on GitHub/i })).toHaveAttribute(
      "href",
      GITHUB_REPO_URL
    );
  });

  it("uses SUPPORT_URL for Report an issue link", () => {
    renderFooter();
    expect(screen.getByRole("link", { name: /Report an issue/i })).toHaveAttribute(
      "href",
      SUPPORT_URL
    );
  });

  it("uses DEMO_URL for the live demo link", () => {
    renderFooter();
    expect(screen.getByRole("link", { name: /Live demo:/i })).toHaveAttribute(
      "href",
      DEMO_URL
    );
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

    expect(screen.getByText(/Demo only: no email is stored/i)).toBeInTheDocument();
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
    expect(screen.queryByText(/Demo only: no email is stored/i)).not.toBeInTheDocument();
  });

  // ── Social icons ─────────────────────────────────────────────────────────
  it("renders the GitHub social icon link", () => {
    renderFooter();
    const githubLink = screen.getByRole("link", { name: /Stellabill on GitHub/i });
    expect(githubLink).toBeInTheDocument();
    expect(githubLink).toHaveAttribute("href", GITHUB_REPO_URL);
  });
});
