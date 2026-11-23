import type { NavigateFunction } from "react-router-dom";
import type { Plan } from "../../data/catalogPlans";
import type { WalletStatus } from "../../wallet/WalletContext";

export function createSubscribeHandler(
	status: WalletStatus,
	navigate: NavigateFunction,
	openWalletModal: () => void,
) {
	return (plan: Plan) => {
		if (status !== "connected") {
			openWalletModal();
			return;
		}
		navigate(`/checkout/${plan.id}`);
	};
}

export function createSendGiftHandler(
	setSelectedPlan: (plan: Plan) => void,
	openGiftModal: () => void,
) {
	return (plan: Plan) => {
		setSelectedPlan(plan);
		openGiftModal();
	};
}

export function createGiftPurchaseCompleteHandler(
	onComplete: (giftCode: string) => void = (giftCode) =>
		console.log("Gift purchased with code:", giftCode),
) {
	return onComplete;
}
