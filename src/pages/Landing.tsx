import PricingCard from "@/components/PricingCard";
import LandingNavbar from "../components/LandingNavbar";
import Footer from "../components/Footer";
import Hero from "../components/Landing/Hero";
import TechBadges from "../components/landing/TechBadges";
import CTACards from "../components/CTACards";
import QuoteCallout from "../components/Landing/QuoteCallout";
import FAQ from "../components/Landing/FAQ";
import PricingCalculator from "../components/Landing/PricingCalculator";

export default function Landing() {
	const handleGetStartedFree = () => {
		console.log("Get started clicked - Free plan");
	};

	const handleStartFreeTrial = () => {
		console.log("Start free trial clicked - Pro plan");
	};

	const handleContactSales = () => {
		console.log("Contact sales clicked - Enterprise plan");
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

				<section id="calculator" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
					<PricingCalculator />
				</section>

				{/* Sections for anchor links */}
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<section
						id="product"
						className="py-24 min-h-[400px]"
					>
						<h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 tracking-tight">
							Product
						</h2>
						<p className="text-slate-400 text-lg leading-relaxed max-w-2xl">
							Stellabill provides the essential infrastructure for recurring USDC payments on the Stellar network. 
							Automate your billing, manage subscriptions, and scale your business with blockchain technology.
						</p>
					</section>

					<section
						id="pricing"
						className="py-24 min-h-[400px]"
					>
						<div className="text-center mb-16">
							<h2 className="text-3xl sm:text-5xl font-bold text-white mb-4 tracking-tight">Simple, Transparent Pricing</h2>
							<p className="text-slate-400 text-lg">Choose the plan that's right for your business growth.</p>
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
									{ text: "99.9% uptime SLA" },
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
									{ text: "Priority support" },
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

					<section id="docs" className="py-24 min-h-[400px]">
						<h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 tracking-tight">
							Documentation
						</h2>
						<p className="text-slate-400 text-lg max-w-2xl">
							Explore our comprehensive guides and API references to integrate Stellabill into your application. 
							From smart contract interactions to webhook management.
						</p>
					</section>

					<section
						id="contact"
						className="py-24 min-h-[400px]"
					>
						<h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 tracking-tight">
							Contact
						</h2>
						<p className="text-slate-400 text-lg max-w-2xl">
							Have questions? Our team is here to help. Reach out for technical support, 
							sales inquiries, or partnership opportunities.
						</p>
					</section>
				</div>
			</main>

			<Footer />
		</div>
	);
}
