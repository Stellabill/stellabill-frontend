export interface Plan {
  id: string;
  merchant: string;
  name: string;
  price: number;
  currency: string;
  interval: "Monthly" | "Yearly";
  description: string;
}

export interface GiftPurchaseData {
  recipientName?: string;
  recipientEmail: string;
  duration: number;
  message?: string;
  deliveryMethod: "email" | "manual" | "scheduled";
  deliveryDate?: string;
}

export type PurchaseStep = "details" | "review" | "complete";
export type DeliveryMethod = "email" | "manual";
export type CopyStatus = "idle" | "success" | "error";
export type GiftFormErrors = Record<string, string>;

export const DURATION_OPTIONS = [
  { value: 1, label: "1 month" },
  { value: 3, label: "3 months" },
  { value: 6, label: "6 months" },
  { value: 12, label: "12 months" },
];

export const DELIVERY_OPTIONS = [
  { value: "email", label: "Email immediately" },
  { value: "manual", label: "Get code to share myself" },
];
