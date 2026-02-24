import { Code2, type LucideIcon, Shield, Vault, Zap } from "lucide-react";

export default function EnterpriseInfrastructureSection() {
	return (
		<section className='relative overflow-hidden bg-[#010508] px-5 py-24 text-white md:px-8 md:py-28'>
			<div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(6,182,212,0.2),transparent_44%)]' />
			<div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_76%,rgba(6,182,212,0.14),transparent_50%)]' />

			<div className='relative mx-auto max-w-[1240px] text-center'>
				<h2 className='text-5xl font-semibold leading-tight tracking-[-0.02em] md:text-7xl'>
					<span className='mr-2 text-[#edf2f7]'>Enterprise-Grade</span>
					<span className='text-cyan-400 drop-shadow-[0_0_18px_rgba(34,211,238,0.75)]'>
						Infrastructure
					</span>
				</h2>

				<p className='mx-auto mt-5 max-w-3xl text-lg leading-relaxed text-slate-400 md:text-xl'>
					Built for Web3 SaaS platforms that demand reliability,
					transparency, and low operational costs.
				</p>

				<div className='mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4'>
					<FeatureCard
						Icon={Vault}
						title='Prepaid Vault Model'
						description='Users deposit USDC into secure vaults. Smart contracts release funds on scheduled intervals—no forced debits, complete transparency and control.'
					/>
					<FeatureCard
						Icon={Zap}
						title='Low Fees, Fast Settlement'
						description='Built on Stellar for near-instant transactions and minimal fees. Settlement happens in seconds, not days, with enterprise-grade reliability.'
					/>
					<FeatureCard
						Icon={Code2}
						title='Usage-Based Billing & APIs'
						description='Flexible merchant APIs for metered billing, tiered pricing, and custom subscription models. Integrate seamlessly with your existing infrastructure.'
					/>
					<FeatureCard
						Icon={Shield}
						title='Built on Soroban'
						description="Powered by Stellar's Soroban smart contracts. Fully auditable, secure, and battle-tested for production workloads in the Web3 ecosystem."
					/>
				</div>
			</div>
		</section>
	);
}

function FeatureCard({
	Icon,
	title,
	description,
}: {
	Icon: LucideIcon;
	title: string;
	description: string;
}) {
	return (
		<div className='rounded-[28px] border border-white/12 bg-[#02070a]/85 p-8 text-left shadow-[inset_0_0_0_1px_rgba(6,182,212,0.03)] transition-all duration-300 hover:border-cyan-300/40 hover:shadow-[0_0_24px_rgba(6,182,212,0.12)]'>
			<div className='mb-7 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-300/20 bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,0.22),rgba(3,20,27,0.9)_70%)] text-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.2)]'>
				<Icon
					size={24}
					strokeWidth={2}
					className='drop-shadow-[0_0_6px_rgba(34,211,238,0.45)]'
				/>
			</div>

			<h3 className='text-xl font-semibold leading-tight text-[#f4f7fa]'>
				{title}
			</h3>

			<p className='mt-5  text-sm leading-relaxed text-slate-400'>
				{description}
			</p>
		</div>
	);
}
