import { useMemo, useState } from 'react';

type PlanKey = 'Starter' | 'Growth' | 'Scale';

interface PlanRecommendation {
  key: PlanKey;
  label: string;
  description: string;
  total: number;
}

const planRecommendations: PlanRecommendation[] = [
  { key: 'Starter', label: 'Starter', description: 'For early teams', total: 0 },
  { key: 'Growth', label: 'Growth', description: 'For product-led teams', total: 250 },
  { key: 'Scale', label: 'Scale', description: 'For high-volume operations', total: 500 },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function PricingCalculator() {
  const [seats, setSeats] = useState(15);
  const [calls, setCalls] = useState(3000);
  const [storage, setStorage] = useState(200);

  const total = useMemo(() => {
    const seatCost = seats * 12;
    const callCost = Math.max(0, calls - 1000) * 0.03;
    const storageCost = storage * 0.4;
    return Math.round(seatCost + callCost + storageCost);
  }, [calls, seats, storage]);

  const recommendedPlan = useMemo(() => {
    const match = planRecommendations.find((plan) => total <= plan.total) ?? planRecommendations[planRecommendations.length - 1];
    return match;
  }, [total]);

  const sliderConfig = [
    {
      label: 'Seats',
      key: 'seats' as const,
      min: 1,
      max: 100,
      value: seats,
      setValue: setSeats,
      helper: 'Ideal for team size',
    },
    {
      label: 'Calls',
      key: 'calls' as const,
      min: 0,
      max: 10000,
      value: calls,
      setValue: setCalls,
      helper: 'Monthly automation runs',
    },
    {
      label: 'Storage',
      key: 'storage' as const,
      min: 0,
      max: 1000,
      value: storage,
      setValue: setStorage,
      helper: 'GB of billed history',
    },
  ];

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/30" aria-labelledby="pricing-calculator-title">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Pricing calculator</p>
          <h3 id="pricing-calculator-title" className="mt-3 text-2xl font-semibold text-white">Estimate your monthly spend</h3>
          <p className="mt-3 text-sm leading-6 text-slate-400">Move the sliders to preview the cost for your expected seat count, API usage, and storage footprint.</p>
        </div>

        <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-5 py-4 text-left">
          <p className="text-sm font-medium text-slate-300">Estimated monthly total</p>
          <p className="mt-2 text-4xl font-semibold text-white" data-testid="pricing-calculator-total">{formatCurrency(total)}</p>
          <div className="mt-4 flex items-center gap-2">
            <span className="rounded-full bg-cyan-400/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-200">Recommended</span>
            <span className="text-sm text-slate-200" data-testid="pricing-calculator-plan">{recommendedPlan.label}</span>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6" aria-label="Pricing controls">
          {sliderConfig.map((item) => (
            <div key={item.key} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex items-center justify-between gap-4">
                <label className="text-sm font-medium text-slate-200" htmlFor={`${item.key}-slider`}>{item.label}</label>
                <div className="flex items-center gap-2 rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-300">
                  <input
                    id={`${item.key}-input`}
                    type="number"
                    min={item.min}
                    max={item.max}
                    value={item.value}
                    onChange={(event) => item.setValue(Number(event.target.value))}
                    className="w-20 border-0 bg-transparent text-right text-sm text-white outline-none"
                    aria-label={`${item.label} input`}
                  />
                  <span className="text-slate-500">{item.key === 'calls' ? 'calls' : item.key === 'storage' ? 'GB' : 'seats'}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <input
                  id={`${item.key}-slider`}
                  type="range"
                  min={item.min}
                  max={item.max}
                  step={item.key === 'calls' ? 250 : 1}
                  value={item.value}
                  onChange={(event) => item.setValue(Number(event.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-800 accent-cyan-400"
                  aria-describedby={`${item.key}-helper`}
                  aria-label={`${item.label} slider`}
                />
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span id={`${item.key}-helper`}>{item.helper}</span>
                <span>{item.min}</span>
                <span>{item.max}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Recommended plan</p>
          <h4 className="mt-3 text-xl font-semibold text-white">{recommendedPlan.label}</h4>
          <p className="mt-2 text-sm leading-6 text-slate-400">{recommendedPlan.description}</p>
          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
            <p className="text-sm text-slate-400">Best fit for a team at this size</p>
            <p className="mt-2 text-2xl font-semibold text-white">{formatCurrency(total)} / month</p>
          </div>
          <a href="#pricing" className="mt-6 inline-flex items-center text-sm font-semibold text-cyan-300 hover:text-cyan-200">Jump to plans →</a>
        </div>
      </div>
    </section>
  );
}
