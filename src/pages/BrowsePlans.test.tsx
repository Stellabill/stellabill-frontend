import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import BrowsePlans from "./BrowsePlans";
import { catalogPlans } from "../data/catalogPlans";

const { loadCatalogMock } = vi.hoisted(() => ({ loadCatalogMock: vi.fn() }));

vi.mock("../data/catalogPlans", async (importOriginal) => {
	const actual = await importOriginal<typeof import("../data/catalogPlans")>();
	return { ...actual, loadCatalog: loadCatalogMock };
});

vi.mock("../wallet/WalletContext", () => ({
	useWallet: () => ({ status: "disconnected", error: null, connect: vi.fn(), clearError: vi.fn(), cancelConnect: vi.fn() }),
}));

vi.mock("../components/WalletConnectModal", () => ({ default: () => null }));
vi.mock("../components/GiftPurchaseModal", () => ({ default: () => null }));

describe("BrowsePlans", () => {
	beforeEach(() => {
		loadCatalogMock.mockReset();
		loadCatalogMock.mockRejectedValueOnce(new Error("Catalog temporarily unavailable"));
		loadCatalogMock.mockResolvedValue(catalogPlans);
	});

	it("shows the load error and retries the catalog", async () => {
		render(
			<MemoryRouter>
				<BrowsePlans />
			</MemoryRouter>,
		);

		expect(await screen.findByRole("alert")).toHaveTextContent("Catalog temporarily unavailable");
		expect(loadCatalogMock).toHaveBeenCalledTimes(1);

		fireEvent.click(screen.getByRole("button", { name: "Try Again" }));

		await waitFor(() => expect(loadCatalogMock).toHaveBeenCalledTimes(2));
		expect(await screen.findByText("Premium Access")).toBeInTheDocument();
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});
});
