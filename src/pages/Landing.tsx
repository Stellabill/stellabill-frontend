import PricingCard from "@/components/PricingCard";
import LandingNavbar from "../components/LandingNavbar";
import Footer from "../components/Footer";
import Hero from "../components/Landing/Hero";
import TechBadges from "../components/Landing/TechBadges";
import CTACards from "../components/CTACards";
import QuoteCallout from "../components/Landing/QuoteCallout";
import FAQ from "../components/Landing/FAQ";

import { useNavigate } from "react-router-dom";
import { openExternal } from "../utils/openExternal";
import { SUPPORT_URL } from "../config/links";

export default function Landing() {
	const navigate = useNavigate();
	const handleGetStartedFree = () => {
		navigate("/dashboard");
	};

	const handleStartFreeTrial = () => {
		navigate("/onboarding");
	};

	const handleContactSales = () => {
		openExternal(SUPPORT_URL);
	};

	return (
		<div className="bg-slate-950 min-h-screen text-slate-200">
			<LandingNavbar />

			<main>
				<Hero />
				<QuoteCallout />

				{/* Technology Badges */}
				<TechBadges />

				{/* CTA Cards */}
				<CTACards />

				{/* Sections for anchor links */}
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<section id="product" className="py-24">
						<h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 tracking-tight">Product</h2>
						<p className="text-slate-400 text-lg leading-relaxed max-w-2xl mb-10">
							Stellabill is subscription billing on the Stellar network. Customers deposit USDC into a prepaid
							vault and Soroban smart contracts release funds to the merchant on each billing interval, so
							there are no forced debits and customers stay in control of their balance.
						</p>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							{[
								["1. Create a plan", "Merchants define price, billing interval and trial in the plan builder."],
								["2. Subscribe and deposit", "Subscribers connect a Stellar wallet (Freighter) and fund a prepaid USDC balance."],
								["3. Automatic billing", "Each interval, the contract charges the plan price from the balance. Pause, resume or cancel any time."],
							].map(([t, d]) => (
								<div key={t} className="rounded-2xl border border-white/10 bg-white/5 p-6">
									<h3 className="text-white font-semibold text-lg mb-2">{t}</h3>
									<p className="text-slate-400">{d}</p>
								</div>
							))}
						</div>
						<div className="mt-8 flex flex-wrap gap-4">
							<a href="/dashboard" className="rounded-xl bg-cyan-400 px-5 py-3 font-bold text-black hover:bg-cyan-300">Explore the demo dashboard</a>
							<a href="/browse-plans" className="rounded-xl border border-white/20 px-5 py-3 font-medium text-white hover:bg-white/10">Browse plans</a>
						</div>
						<p className="mt-4 text-sm text-slate-500">All data shown in the app is sample demo data.</p>
					</section>

					<section
						id="pricing"
						className="py-24 min-h-[400px]"
					>
						<div className="text-center mb-16">
							<h2 className="text-3xl sm:text-5xl font-bold text-white mb-4 tracking-tight">Simple, Transparent Pricing</h2>
							<p className="text-slate-400 text-lg">Illustrative demo pricing. Stellabill is an open-source project and these tiers are not live offers.</p>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start justify-center">
							{/* Free Plan */}
							<PricingCard
								title="Free"
								tagline="Perfect for testing and small projects"
								price="$0"
								priceSubtext="/ forever"
								features={[
									{ text: "Up to 100 subscriptions" },
									{ text: "Basic API access" },
									{ text: "Community support" },
									{ text: "Standard webhooks" },
									{ text: "Test mode included" },
									{ text: "Standard support" },
								]}
								buttonText="Get started"
								onButtonClick={handleGetStartedFree}
								useGradientButton={false}
							/>

							{/* Pro Plan - Most Popular */}
							<PricingCard
								title="Pro"
								tagline="For growing businesses and startups"
								price="$49"
								priceSubtext="/ per month"
								features={[
									{ text: "Unlimited subscriptions" },
									{ text: "Full API access" },
									{ text: "Priority support (demo)" },
									{ text: "Advanced webhooks" },
									{ text: "Usage-based billing" },
									{ text: "Custom billing intervals" },
								]}
								buttonText="Start free trial"
								onButtonClick={handleStartFreeTrial}
								isPopular={true}
								isPopularLabel="Most popular"
								useGradientButton={true}
							/>

							{/* Enterprise Plan */}
							<PricingCard
								title="Enterprise"
								tagline="Custom solutions for large organizations"
								priceLabel="Custom"
								priceSubtext="contact sales"
								features={[
									{ text: "Everything in Pro" },
									{ text: "Dedicated support team" },
									{ text: "Custom SLAs" },
									{ text: "Volume pricing" },
									{ text: "White-label options" },
									{ text: "Onboarding assistance" },
								]}
								buttonText="Contact sales"
								onButtonClick={handleContactSales}
								useGradientButton={false}
							/>
						</div>
					</section>

					<FAQ />

					<section id="docs" className="py-24">
						<h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 tracking-tight">Documentation</h2>
						<p className="text-slate-400 text-lg max-w-2xl mb-6">
							Setup, scripts and deployment notes live in the project README. Feature guides are in the repository docs folder.
						</p>
						<ul className="space-y-2 text-cyan-400">
							<li><a className="hover:underline" href="https://github.com/Stellabill/stellabill-frontend#readme" target="_blank" rel="noopener noreferrer">README and quickstart</a></li>
							<li><a className="hover:underline" href="https://github.com/Stellabill/stellabill-frontend/tree/main/docs" target="_blank" rel="noopener noreferrer">Feature guides</a></li>
							<li><a className="hover:underline" href="/about-prepaid-balances">About prepaid balances</a></li>
						</ul>
					</section>

					<section id="contact" className="py-24">
						<h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 tracking-tight">Contact</h2>
						<p className="text-slate-400 text-lg max-w-2xl">
							Stellabill is open source. Questions, bugs and ideas are welcome as{" "}
							<a className="text-cyan-400 hover:underline" href="https://github.com/Stellabill/stellabill-frontend/issues" target="_blank" rel="noopener noreferrer">GitHub issues</a>.
						</p>
					</section>
				</div>
			</main>

			<Footer />
		</div>
	);
}
