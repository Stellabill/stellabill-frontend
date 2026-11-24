import { describe, expect, it, vi } from "vitest";
import type { NavigateFunction } from "react-router-dom";
import type { Plan } from "../../data/catalogPlans";
import {
	createGiftPurchaseCompleteHandler,
	createSendGiftHandler,
	createSubscribeHandler,
} from "./browsePlansHandlers";

const plan: Plan = {
	id: "plan-1",
	merchant: "Stellar News",
	name: "Premium",
	price: 10,
	currency: "USDC",
	interval: "Monthly",
	description: "Premium access",
	icon: "newspaper",
};

describe("browsePlansHandlers", () => {
	it("opens the wallet modal for disconnected subscriptions", () => {
		const navigate = vi.fn();
		const openWalletModal = vi.fn();
		const handler = createSubscribeHandler(
			"disconnected",
			navigate as unknown as NavigateFunction,
			openWalletModal,
		);

		handler(plan);
		expect(openWalletModal).toHaveBeenCalledOnce();
		expect(navigate).not.toHaveBeenCalled();
	});

	it("navigates connected subscriptions to checkout", () => {
		const navigate = vi.fn();
		const openWalletModal = vi.fn();
		const handler = createSubscribeHandler(
			"connected",
			navigate as unknown as NavigateFunction,
			openWalletModal,
		);

		handler(plan);
		expect(navigate).toHaveBeenCalledWith("/checkout/plan-1");
		expect(openWalletModal).not.toHaveBeenCalled();
	});

	it("opens the gift modal with the selected plan", () => {
		const setSelectedPlan = vi.fn();
		const openGiftModal = vi.fn();
		const handler = createSendGiftHandler(setSelectedPlan, openGiftModal);

		handler(plan);
		expect(setSelectedPlan).toHaveBeenCalledWith(plan);
		expect(openGiftModal).toHaveBeenCalledOnce();
	});

	it("passes gift purchase completion to its callback", () => {
		const onComplete = vi.fn();
		const handler = createGiftPurchaseCompleteHandler(onComplete);

		handler("gift-code");
		expect(onComplete).toHaveBeenCalledWith("gift-code");
	});
});
