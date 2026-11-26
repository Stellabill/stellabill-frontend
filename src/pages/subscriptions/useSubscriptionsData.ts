import { createElement, useCallback, useEffect, useRef, useState } from "react";
import { subscriptions, ApiError } from "../../api/client";
import type { Subscription } from "@/types/subscription";
import { useTags } from "../../hooks/useTags";
import { IconCloud } from "./icons";
import { FIXTURE_DATA } from "./fixtures";
import { formatCoverage } from "./subscriptionUtils";
import type { SubscriptionWithIcon } from "./types";

export function useSubscriptionsData() {
	const [data, setData] = useState<SubscriptionWithIcon[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<ApiError | null>(null);
	const abortRef = useRef<AbortController | null>(null);

	const mapSubscription = useCallback((sub: Subscription & { prepaidBalance?: number }): SubscriptionWithIcon => {
		const balance = typeof sub.prepaidBalance === "number" ? sub.prepaidBalance : 0;
		return {
			...sub,
			icon: createElement(IconCloud),
			prepaidBalance: balance,
			coverage: formatCoverage(balance, sub.price),
		};
	}, []);

	const fetchSubscriptions = useCallback(() => {
		abortRef.current?.abort();
		const controller = new AbortController();
		abortRef.current = controller;

		setLoading(true);
		setError(null);

		return (async () => {
			try {
				let mapped: SubscriptionWithIcon[];
				if (import.meta.env.VITE_USE_FIXTURES) {
					mapped = FIXTURE_DATA;
				} else {
					const res = await subscriptions.list();
					mapped = res.subscriptions.map(mapSubscription);
				}

				if (controller.signal.aborted) return;

				setData((prev) => {
					// Merge server data with pending optimistic updates
					const pending = new Map(prev.map((s) => [s.id, s]));
					return mapped.map((server) => {
						const local = pending.get(server.id);
						if (local && local.status !== server.status) {
							return { ...server, status: local.status };
						}
						return server;
					});
				});
			} catch (err: unknown) {
				if (controller.signal.aborted) return;
				setError(err as ApiError);
			} finally {
				if (!controller.signal.aborted) {
					setLoading(false);
				}
			}
		})();
	}, [mapSubscription]);

	useEffect(() => {
		fetchSubscriptions();
		return () => {
			abortRef.current?.abort();
		};
	}, [fetchSubscriptions]);

	// Use the shared tags hook for persistence and synchronization
	const tagsHook = useTags();
	const availableTags = tagsHook.getAllTags();

	// Rebuild data with tags from the hook
	useEffect(() => {
		setData((prev) =>
			prev.map((sub) => ({
				...sub,
				tags: tagsHook.getSubscriptionTags(sub.id),
			})),
		);
	}, [tagsHook.subscriptionTags, tagsHook.tags]);

	const applyTopUp = useCallback((subId: string, amount: number) => {
		setData((prev) =>
			prev.map((sub) => {
				if (sub.id !== subId) return sub;
				const currentNum = sub.prepaidBalance || 0;
				const updatedNum = currentNum + amount;
				return {
					...sub,
					prepaidBalance: updatedNum,
					coverage: formatCoverage(updatedNum, sub.price),
				};
			}),
		);
	}, []);

	return {
		data,
		setData,
		loading,
		error,
		fetchSubscriptions,
		tagsHook,
		availableTags,
		applyTopUp,
	};
}
