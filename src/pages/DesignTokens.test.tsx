import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import App from "../App";
import DesignTokens from "./DesignTokens";

describe("DesignTokens", () => {
  it("renders searchable token groups and copy samples", () => {
    render(<DesignTokens />);

    expect(screen.getByRole("heading", { name: /design tokens/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /colors/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /spacing/i })).toBeInTheDocument();
    expect(screen.getByText("--color-brand-primary")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /var\(--color-brand-primary\)/i })).toBeInTheDocument();
  });

  it("filters by category and invalid search without mutating token data", async () => {
    const user = userEvent.setup();
    render(<DesignTokens />);

    await user.click(screen.getByRole("button", { name: /motion/i }));

    expect(screen.getByText("--motion-duration-fast")).toBeInTheDocument();
    expect(screen.queryByText("--space-4")).not.toBeInTheDocument();

    await user.type(screen.getByRole("searchbox", { name: /search tokens/i }), "does-not-exist");

    expect(screen.getByRole("status")).toHaveTextContent(/no matching tokens/i);
    expect(screen.queryByText("--motion-duration-fast")).not.toBeInTheDocument();
  });

  it("handles duplicate matching text with stable token names", async () => {
    const user = userEvent.setup();
    render(<DesignTokens />);

    await user.type(screen.getByRole("searchbox", { name: /search tokens/i }), "brand");

    expect(screen.getByText("--color-brand-primary")).toBeInTheDocument();
    expect(screen.getByText("--color-brand-accent")).toBeInTheDocument();
  });

  it("reports copy success and copy failure", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    vi.stubGlobal("isSecureContext", true);

    render(<DesignTokens />);

    await user.click(screen.getByRole("button", { name: /var\(--space-4\)/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: /copied/i })).toBeInTheDocument());
    expect(writeText).toHaveBeenCalledWith("var(--space-4)");

    writeText.mockRejectedValueOnce(new Error("denied"));
    vi.spyOn(document, "execCommand").mockReturnValue(false);

    await user.click(screen.getByRole("button", { name: /var\(--space-6\)/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: /copy failed/i })).toBeInTheDocument());
  });

  it("is available at the authenticated design tokens route", () => {
    render(
      <MemoryRouter initialEntries={["/design-tokens"]}>
        <Routes>
          <Route path="/*" element={<App />} />
        </Routes>
      </MemoryRouter>,
    );

    const developerNav = screen.getByRole("navigation", { name: /primary/i });
    expect(within(developerNav).getByRole("link", { name: /design tokens/i })).toHaveAttribute("href", "/design-tokens");
    expect(screen.getByRole("heading", { name: /design tokens/i })).toBeInTheDocument();
  });
});
