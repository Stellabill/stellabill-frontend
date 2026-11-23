import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import BrowsePlans from "./BrowsePlans";
import { copyToClipboard } from "../utils/clipboard";

vi.mock("../wallet/WalletContext", () => ({
	useWallet: () => ({
		status: "disconnected",
		error: null,
		connect: vi.fn(),
		clearError: vi.fn(),
		cancelConnect: vi.fn(),
	}),
}));

vi.mock("../utils/clipboard", async (importOriginal) => {
	const actual = await importOriginal<typeof import("../utils/clipboard")>();
	return { ...actual, copyToClipboard: vi.fn().mockResolvedValue(true) };
});

const mockedCopyToClipboard = vi.mocked(copyToClipboard);

describe("BrowsePlans gift purchase flow", () => {
	beforeEach(() => {
		mockedCopyToClipboard.mockClear();
		mockedCopyToClipboard.mockResolvedValue(true);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("shows a success toast with copy button and never logs gift code to console", async () => {
		const user = userEvent.setup();
		const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

		render(
			<MemoryRouter>
				<BrowsePlans />
			</MemoryRouter>,
		);

		const giftButtons = await screen.findAllByRole("button", { name: /send .* as a gift/i }, { timeout: 3000 });
		await user.click(giftButtons[0]);

		const emailInput = screen.getByLabelText(/recipient email/i);
		await user.type(emailInput, "friend@example.com");

		await user.click(screen.getByRole("button", { name: /review gift/i }));
		await user.click(screen.getByRole("button", { name: /confirm purchase/i }));

		await waitFor(
			() => {
				expect(screen.getByText(/gift created/i)).toBeInTheDocument();
			},
			{ timeout: 4000 },
		);

		for (const call of consoleLogSpy.mock.calls) {
			const joined = call.map(String).join(" ");
			expect(joined).not.toMatch(/GIFT-/);
			expect(joined).not.toContain("Gift purchased with code:");
		}

		const copyBtn = screen.getByRole("button", { name: /copy code/i });
		await user.click(copyBtn);

		await waitFor(() => {
			expect(mockedCopyToClipboard).toHaveBeenCalledWith(expect.stringMatching(/^GIFT-/));
		});
	});
});
