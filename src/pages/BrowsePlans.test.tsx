import { act, fireEvent, render, screen } from "@testing-library/react";
import {
	MemoryRouter,
	Route,
	Routes,
	useLocation,
	useNavigate,
} from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import BrowsePlans from "./BrowsePlans";

vi.mock("../wallet/WalletContext", () => ({
	useWallet: () => ({ status: "connected" }),
}));

function RouterLocation() {
	const { search } = useLocation();
	return <output data-testid="location-query">{search}</output>;
}

function Checkout() {
	const navigate = useNavigate();
	return <button onClick={() => navigate(-1)}>Return to plans</button>;
}

function openBrowsePlans(search = "") {
	render(
		<MemoryRouter initialEntries={[{ pathname: "/browse-plans", search }]}>
			<Routes>
				<Route path="/browse-plans" element={<BrowsePlans />} />
				<Route path="/checkout/:planId" element={<Checkout />} />
			</Routes>
			<RouterLocation />
		</MemoryRouter>,
	);
}

function readQuery() {
	return new URLSearchParams(screen.getByTestId("location-query").textContent ?? "");
}

async function loadCatalog() {
	await act(async () => {
		await vi.advanceTimersByTimeAsync(800);
	});
}

describe("BrowsePlans URL filters", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("applies the search and billing interval from a deep link", async () => {
		openBrowsePlans("?interval=Yearly&q=news");
		await loadCatalog();

		expect(screen.getByRole("searchbox")).toHaveValue("news");
		expect(screen.getByLabelText("Filter plans by billing interval")).toHaveValue("Yearly");
		expect(screen.getByRole("heading", { name: "Annual Premium" })).toBeInTheDocument();
		expect(screen.queryByRole("heading", { name: "Premium Access" })).not.toBeInTheDocument();
		expect(screen.queryByRole("heading", { name: "Pro Plan" })).not.toBeInTheDocument();
	});

	it("uses all intervals for an unknown value while still applying the search", async () => {
		openBrowsePlans("?interval=weekly&q=news");
		await loadCatalog();

		expect(screen.getByLabelText("Filter plans by billing interval")).toHaveValue("All");
		expect(screen.getByRole("heading", { name: "Annual Premium" })).toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "Premium Access" })).toBeInTheDocument();
		expect(screen.queryByRole("heading", { name: "Pro Plan" })).not.toBeInTheDocument();
	});

	it("deletes an empty search and clears both filters on Escape", async () => {
		openBrowsePlans("?interval=Yearly&q=news&source=email");
		await loadCatalog();
		const search = screen.getByRole("searchbox");

		fireEvent.change(search, { target: { value: "" } });
		expect(readQuery().has("q")).toBe(false);
		expect(readQuery().get("interval")).toBe("Yearly");

		fireEvent.change(search, { target: { value: "news" } });
		expect(readQuery().get("q")).toBe("news");
		fireEvent.keyDown(search, { key: "Escape" });

		expect(search).toHaveValue("");
		expect(screen.getByLabelText("Filter plans by billing interval")).toHaveValue("All");
		expect(Object.fromEntries(readQuery())).toEqual({ source: "email" });
	});

	it("restores the chosen filters when returning from Checkout", async () => {
		openBrowsePlans();
		await loadCatalog();
		fireEvent.change(screen.getByRole("searchbox"), { target: { value: "news" } });
		fireEvent.change(screen.getByLabelText("Filter plans by billing interval"), {
			target: { value: "Yearly" },
		});
		fireEvent.click(screen.getByRole("button", { name: /subscribe to annual premium/i }));
		fireEvent.click(screen.getByRole("button", { name: "Return to plans" }));
		await loadCatalog();

		expect(screen.getByRole("searchbox")).toHaveValue("news");
		expect(screen.getByLabelText("Filter plans by billing interval")).toHaveValue("Yearly");
		expect(screen.getByRole("heading", { name: "Annual Premium" })).toBeInTheDocument();
		expect(screen.queryByRole("heading", { name: "Premium Access" })).not.toBeInTheDocument();
	});
});
