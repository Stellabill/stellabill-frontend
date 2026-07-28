import { Code2, Info, Shield, type LucideIcon, Vault, Zap } from 'lucide-react';
import { useId } from 'react';

type InfrastructureNode = {
	Icon: LucideIcon;
	title: string;
	summary: string;
	description: string;
	accent: string;
};

const nodes: InfrastructureNode[] = [
	{
		Icon: Vault,
		title: 'Prepaid Vault',
		summary: 'USDC deposits and release schedules',
		description:
			'Customers fund prepaid vaults with USDC and the contract releases balances on schedule, giving teams transparent reserve management without forced debits.',
		accent: 'from-cyan-400/20 via-cyan-400/5 to-transparent',
	},
	{
		Icon: Zap,
		title: 'Settlement Layer',
		summary: 'Near-instant finality',
		description:
			'Stellar transactions settle in seconds, allowing merchants to reconcile revenue quickly while keeping fees predictable and low at enterprise scale.',
		accent: 'from-fuchsia-400/20 via-cyan-400/10 to-transparent',
	},
	{
		Icon: Code2,
		title: 'Billing APIs',
		summary: 'Usage-based pricing and orchestration',
		description:
			'Merchant APIs support metered billing, tiered plans, and custom subscription logic so growth teams can ship new commercial models without bespoke engineering.',
		accent: 'from-emerald-400/20 via-cyan-400/10 to-transparent',
	},
	{
		Icon: Shield,
		title: 'Soroban Security',
		summary: 'Auditable, production-safe contracts',
		description:
			'Soroban smart contracts provide an auditable core for policy enforcement, approvals, and reserve controls that teams can inspect and verify over time.',
		accent: 'from-violet-400/20 via-cyan-400/10 to-transparent',
	},
];

export default function EnterpriseInfrastructureSection() {
	const diagramLabel = 'Enterprise infrastructure architecture showing prepaid vaults, settlement, billing APIs, and Soroban security controls.';
	const tableLabel = 'Enterprise infrastructure architecture components';

	return (
		<section className='relative overflow-hidden bg-[#010508] px-5 py-24 text-white md:px-8 md:py-28'>
			<div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(6,182,212,0.2),transparent_44%)]' />
			<div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_76%,rgba(6,182,212,0.14),transparent_50%)]' />

			<div className='relative mx-auto max-w-[1240px]'>
				<div className='mx-auto max-w-3xl text-center'>
					<h2 className='text-4xl font-semibold leading-tight tracking-[-0.02em] sm:text-5xl md:text-7xl'>
						<span className='mr-2 text-[#edf2f7]'>Enterprise-Grade</span>
						<span className='text-cyan-400 drop-shadow-[0_0_18px_rgba(34,211,238,0.75)]'>
							Infrastructure
						</span>
					</h2>

					<p className='mx-auto mt-5 max-w-3xl text-lg leading-relaxed text-slate-400 md:text-xl'>
						Built for Web3 SaaS platforms that demand reliability, transparency, and low operational costs.
					</p>
				</div>

				<div className='mt-12 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center'>
					<div className='rounded-[32px] border border-white/10 bg-[#02070a]/80 p-6 shadow-[inset_0_0_0_1px_rgba(6,182,212,0.04)] sm:p-8'>
						<div className='flex flex-wrap items-center gap-3'>
							<span className='rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-sm font-medium text-cyan-300'>
								Architecture overview
							</span>
							<span className='rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-400'>
								Reduced motion: static equivalent available
							</span>
						</div>

						<p className='mt-5 max-w-2xl text-base leading-7 text-slate-300'>
							A resilient operating model that keeps funds, settlement, billing, and security controls aligned from one shared platform.
						</p>

						<ul className='mt-6 grid gap-3 sm:grid-cols-2'>
							{[
								'Transparent reserve flows',
								'Low-fee settlement at scale',
								'API-first commercial controls',
								'Production-safe contract governance',
							].map((item) => (
								<li key={item} className='flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300'>
									<span className='h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.75)]' />
									<span>{item}</span>
								</li>
							))}
						</ul>
					</div>

					<div className='rounded-[32px] border border-cyan-400/20 bg-[#02070a]/85 p-4 shadow-[0_0_40px_rgba(6,182,212,0.08)] sm:p-6'>
						<figure>
							<div className='relative overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(135deg,rgba(6,182,212,0.12),rgba(2,15,28,0.95)_70%)] p-4 sm:p-6'>
								<div className='absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_48%)]' />
								<div className='absolute inset-x-10 top-1/2 hidden h-px -translate-y-1/2 border-t border-dashed border-cyan-400/35 lg:block' />
								<div className='absolute bottom-16 left-1/2 hidden h-24 w-px -translate-x-1/2 border-l border-dashed border-cyan-400/35 lg:block' />
								<div className='infrastructure-flow-line absolute inset-x-10 top-1/2 hidden h-px -translate-y-1/2 lg:block' />
								<div className='relative z-10 grid gap-3 lg:grid-cols-2'>
									{nodes.map((node, index) => (
										<ArchitectureNode key={node.title} node={node} index={index} />
									))}
								</div>
								<div className='relative z-10 mt-4 rounded-2xl border border-cyan-400/20 bg-[#001118]/80 p-4 text-sm text-slate-300'>
									<div className='flex flex-wrap items-center justify-between gap-3'>
										<div>
											<p className='font-semibold text-white'>Flow legend</p>
											<p className='mt-1 text-slate-400'>Every control is connected to the same auditable revenue loop.</p>
										</div>
										<div className='flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-slate-400'>
											<span className='rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1'>Funds</span>
											<span className='rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1'>Settlement</span>
											<span className='rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1'>Billing</span>
											<span className='rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1'>Security</span>
										</div>
									</div>
								</div>
							</div>

							<figcaption className='sr-only'>{diagramLabel}</figcaption>
							<div className='sr-only' role='img' aria-label={diagramLabel} />
							<table className='sr-only' aria-label={tableLabel}>
								<caption className='sr-only'>Enterprise infrastructure architecture components</caption>
								<thead>
									<tr>
										<th scope='col'>Component</th>
										<th scope='col'>Role</th>
										<th scope='col'>Key detail</th>
									</tr>
								</thead>
								<tbody>
									<tr>
										<td>Prepaid Vault</td>
										<td>Reserve management</td>
										<td>USDC deposits release on schedule without forced debits.</td>
									</tr>
									<tr>
										<td>Settlement Layer</td>
										<td>Transaction processing</td>
										<td>Near-instant settlement with low fees.</td>
									</tr>
									<tr>
										<td>Billing APIs</td>
										<td>Commercial control plane</td>
										<td>Usage-based billing and custom subscription logic.</td>
									</tr>
									<tr>
										<td>Soroban Security</td>
										<td>Policy and audit layer</td>
										<td>Auditable contracts enforce approvals and reserve rules.</td>
									</tr>
								</tbody>
							</table>
						</figure>
					</div>
				</div>
			</div>

			<style>{`
				.infrastructure-flow-line {
					background: linear-gradient(90deg, transparent 0%, rgba(34, 211, 238, 0.85) 50%, transparent 100%);
					box-shadow: 0 0 18px rgba(34, 211, 238, 0.28);
					animation: infrastructure-flow var(--flow-duration, 3s) linear infinite;
				}

				@keyframes infrastructure-flow {
					0% { transform: translateY(-50%) translateX(-30%); opacity: 0.2; }
					50% { opacity: 1; }
					100% { transform: translateY(-50%) translateX(30%); opacity: 0.2; }
				}

				@media (prefers-reduced-motion: reduce) {
					.infrastructure-flow-line {
						animation: none !important;
					}
				}
			`}</style>
		</section>
	);
}

function ArchitectureNode({
	node,
	index,
}: {
	node: InfrastructureNode;
	index: number;
}) {
	const tooltipId = useId();
	const isOffset = index % 2 === 1;

	return (
		<div className={`group relative ${isOffset ? 'lg:translate-y-8' : ''}`}>
			<button
				type='button'
				aria-label={`View details for ${node.title}`}
				aria-describedby={tooltipId}
				className='relative flex w-full items-start gap-3 rounded-[22px] border border-white/10 bg-[#00131b]/80 p-4 text-left transition-all duration-300 hover:border-cyan-400/40 hover:bg-[#06202a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#010508]'
			>
				<div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${node.accent} border border-cyan-400/20 text-cyan-300`}>
					<node.Icon size={20} strokeWidth={2} />
				</div>
				<div className='min-w-0'>
					<p className='font-semibold text-white'>{node.title}</p>
					<p className='mt-1 text-sm text-slate-400'>{node.summary}</p>
				</div>
				<span className='ml-auto mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cyan-400/20 bg-white/5 text-cyan-300'>
					<Info size={16} strokeWidth={2} />
				</span>
			</button>

			<span
				id={tooltipId}
				role='tooltip'
				className='pointer-events-none absolute left-1/2 top-full z-20 mt-3 w-[min(260px,calc(100%-1rem))] -translate-x-1/2 rounded-2xl border border-cyan-400/20 bg-slate-950/95 p-3 text-sm text-slate-300 opacity-0 shadow-[0_0_24px_rgba(6,182,212,0.16)] transition-all duration-200 group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible invisible'
			>
				{node.description}
			</span>
		</div>
	);
}
