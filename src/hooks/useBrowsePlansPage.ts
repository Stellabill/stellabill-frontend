import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ApiError } from "../api/client";
import { catalogPlans as mockPlans, type Plan, type PlanInterval } from "../data/catalogPlans";
import { useWallet } from "../wallet/WalletContext";
import {
	filterAndSortPlans,
	parseSortValue,
	type SortDirection,
	type SortField,
} from "../pages/browsePlans/browsePlansUtils";
import {
	createGiftPurchaseCompleteHandler,
	createSendGiftHandler,
	createSubscribeHandler,
} from "../pages/browsePlans/browsePlansHandlers";

export function useBrowsePlansPage() {
	const navigate = useNavigate();
	const [plans, setPlans] = useState<Plan[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<ApiError | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [intervalFilter, setIntervalFilter] = useState<PlanInterval | "All">("All");
	const [sortField, setSortField] = useState<SortField>("name");
	const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
	const [walletModalOpen, setWalletModalOpen] = useState(false);
	const [giftModalOpen, setGiftModalOpen] = useState(false);
	const [selectedPlanForGift, setSelectedPlanForGift] = useState<Plan | null>(null);
	const {
		status,
		error: walletError,
		connect,
		clearError,
		cancelConnect,
	} = useWallet();

	const fetchPlans = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			await new Promise((resolve, reject) => {
				setTimeout(() => {
					if (window.location.search.includes("simulate_error")) {
						const err: ApiError = new Error("Failed to load plans from catalog");
						err.status = 500;
						err.technicalDetails =
							"The decentralized plan registry is experiencing high latency. [Error Code: REG-CAT-503]";
						reject(err);
					} else {
						resolve(true);
					}
				}, 800);
			});
			setPlans(mockPlans);
			setLoading(false);
		} catch (err: unknown) {
			setError(err as ApiError);
			setPlans(mockPlans);
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchPlans();
	}, [fetchPlans]);

	const filteredPlans = useMemo(
		() =>
			filterAndSortPlans(
				plans,
				searchQuery,
				intervalFilter,
				sortField,
				sortDirection,
			),
		[plans, searchQuery, intervalFilter, sortField, sortDirection],
	);

	const handleSortChange = useCallback(
		(value: string) => {
			const parsed = parseSortValue(value);
			setSortField(parsed.sortField);
			setSortDirection(parsed.sortDirection);
		},
		[],
	);

	const handleSubscribe = useMemo(
		() =>
			createSubscribeHandler(status, navigate, () => setWalletModalOpen(true)),
		[status, navigate],
	);

	const handleSendGift = useMemo(
		() =>
			createSendGiftHandler(
				setSelectedPlanForGift,
				() => setGiftModalOpen(true),
			),
		[],
	);

	const handleGiftPurchaseComplete = useMemo(
		() => createGiftPurchaseCompleteHandler(),
		[],
	);

	const handleWalletConnect = useCallback(async () => {
		try {
			const result = await connect();
			if (!result) return;
			setWalletModalOpen(false);
		} catch {
			// The provider exposes the error to the modal.
		}
	}, [connect]);

	const clearFilters = useCallback(() => {
		setSearchQuery("");
		setIntervalFilter("All");
		setSortField("name");
		setSortDirection("asc");
	}, []);

	return {
		loading,
		error,
		searchQuery,
		setSearchQuery,
		intervalFilter,
		setIntervalFilter,
		sortField,
		sortDirection,
		handleSortChange,
		filteredPlans,
		clearFilters,
		fetchPlans,
		walletModalOpen,
		setWalletModalOpen,
		giftModalOpen,
		setGiftModalOpen,
		selectedPlanForGift,
		status,
		walletError,
		clearError,
		cancelConnect,
		handleSubscribe,
		handleSendGift,
		handleGiftPurchaseComplete,
		handleWalletConnect,
	};
}
