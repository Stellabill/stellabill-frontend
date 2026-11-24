// Sample plan catalog shared by Browse Plans and Checkout (no backend is deployed for this demo).
export type PlanInterval = "Monthly" | "Yearly";

export interface Plan {
	id: string;
	merchant: string;
	name: string;
	price: number;
	currency: string;
	interval: PlanInterval;
	description: string;
	icon: "newspaper" | "cloud" | "robot" | "muscle" | "fitness" | "chart";
}

export const catalogPlans: Plan[] = [
	{
		id: "1",
		merchant: "Stellar News",
		name: "Premium Access",
		price: 10,
		currency: "USDC",
		interval: "Monthly",
		description:
			"Get unlimited access to premium articles, exclusive interviews, and breaking news coverage.",
		icon: "newspaper",
	},
	{
		id: "2",
		merchant: "CloudFlow",
		name: "Pro Plan",
		price: 25,
		currency: "USDC",
		interval: "Monthly",
		description:
			"Advanced cloud storage with 1TB space, priority support, and team collaboration features.",
		icon: "cloud",
	},
	{
		id: "3",
		merchant: "DevTools AI",
		name: "Starter",
		price: 15,
		currency: "USDC",
		interval: "Monthly",
		description:
			"AI-powered development tools with code completion, debugging, and documentation generation.",
		icon: "robot",
	},
	{
		id: "4",
		merchant: "Stellar News",
		name: "Annual Premium",
		price: 100,
		currency: "USDC",
		interval: "Yearly",
		description:
			"Full year of premium access at a discounted rate. Save 17% compared to monthly billing.",
		icon: "newspaper",
	},
	{
		id: "5",
		merchant: "CloudFlow",
		name: "Enterprise",
		price: 50,
		currency: "USDC",
		interval: "Monthly",
		description:
			"Unlimited storage, advanced security, dedicated support, and custom integrations for teams.",
		icon: "cloud",
	},
	{
		id: "6",
		merchant: "FitTrack",
		name: "Premium Coaching",
		price: 30,
		currency: "USDC",
		interval: "Monthly",
		description:
			"Personal fitness coaching with custom workout plans, nutrition tracking, and weekly check-ins.",
		icon: "fitness",
	},
];

export function findCatalogPlan(id: string): Plan | undefined {
	return catalogPlans.find((plan) => plan.id === id);
}
