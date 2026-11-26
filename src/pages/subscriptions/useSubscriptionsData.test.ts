import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { subscriptions, ApiError } from "../../api/client";
import { useSubscriptionsData } from "./useSubscriptionsData";

vi.mock("../../api/client", () => ({
	subscriptions: {
		list: vi.fn(),
	},
	ApiError: class ApiError extends Error {
		statusCode: number;
		isOffline: boolean;
		technicalDetails?: string;
		constructor(message: string, statusCode = 500, isOffline = false, technicalDetails?: string) {
			super(message);
			this.statusCode = statusCode;
			this.isOffline = isOffline;
			this.technicalDetails = technicalDetails;
		}
	},
}));

describe("useSubscriptionsData", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("loads subscriptions from API and maps prepaid balance and coverage", async () => {
		vi.mocked(subscriptions.list).mockResolvedValue({
			subscriptions: [
				{
					id: "SUB-100",
					planName: "Pro Plan",
					merchantName: "CloudFlow",
					status: "Active",
					price: 25,
					currency: "USDC",
					interval: "month",
					prepaidBalance: 75,
					nextCharge: "Mar 20, 2026",
					lastPayment: "Feb 20, 2026",
					subscribedSince: "Jan 20, 2026",
				},
			],
		});

		const { result } = renderHook(() => useSubscriptionsData());

		expect(result.current.loading).toBe(true);

		await waitFor(() => {
			expect(result.current.loading).toBe(false);
		});

		expect(result.current.error).toBeNull();
		expect(result.current.data).toHaveLength(1);
		expect(result.current.data[0].id).toBe("SUB-100");
		expect(result.current.data[0].coverage).toBe("~3 payments");
	});

	it("captures API errors and clears loading state", async () => {
		const apiErr = new ApiError("Server unavailable", 503, false, "HTTP 503");
		vi.mocked(subscriptions.list).mockRejectedValue(apiErr);

		const { result } = renderHook(() => useSubscriptionsData());

		await waitFor(() => {
			expect(result.current.loading).toBe(false);
		});

		expect(result.current.error).toBe(apiErr);
		expect(result.current.data).toEqual([]);
	});

	it("updates prepaid balance and coverage via applyTopUp", async () => {
		vi.mocked(subscriptions.list).mockResolvedValue({
			subscriptions: [
				{
					id: "SUB-101",
					planName: "Starter",
					merchantName: "Acme",
					status: "Active",
					price: 10,
					currency: "USDC",
					interval: "month",
					prepaidBalance: 10,
					nextCharge: "Mar 20, 2026",
					lastPayment: "Feb 20, 2026",
					subscribedSince: "Jan 20, 2026",
				},
			],
		});

		const { result } = renderHook(() => useSubscriptionsData());

		await waitFor(() => {
			expect(result.current.loading).toBe(false);
		});

		act(() => {
			result.current.applyTopUp("SUB-101", 20);
		});

		expect(result.current.data[0].prepaidBalance).toBe(30);
		expect(result.current.data[0].coverage).toBe("~3 payments");
	});
});
