import type React from "react";
import type { Subscription } from "@/types/subscription";
import type { TagOption } from "../../components/AddTagPopover";

export interface SubscriptionWithIcon extends Omit<Subscription, "icon"> {
	icon: React.ReactNode;
	prepaidBalance: number;
	coverage: string;
	tags?: TagOption[]; // Tags are managed separately via the useTags hook
}

export type StatusType = "Active" | "Paused" | "Cancelled";

export type FilterTab = "All" | StatusType;

export type SortField = "planName" | "price" | "nextCharge" | "status";
export type SortDirection = "asc" | "desc";

export interface SortState {
	field: SortField;
	direction: SortDirection;
}

export interface SubscriptionActionError {
	message: string;
	technicalDetails?: string;
}

export interface SubscriptionStats {
	All: number;
	Active: number;
	Paused: number;
	Cancelled: number;
}
