import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

interface PlanFeature {
  text: string;
}

interface Plan {
  title: string;
  tagline: string;
  price: string;
  priceSubtext: string;
  features: PlanFeature[];
  buttonText: string;
  isPopular?: boolean;
  popularLabel?: string;
}

const plans: Plan[] = [
  {
    title: 'Free',
    tagline: 'Perfect for testing and small projects',
    price: '$0',
    priceSubtext: '/ forever',
    features: [
      { text: 'Up to 100 subscriptions' },
      { text: 'Basic API access' },
      { text: 'Community support' },
      { text: 'Standard webhooks' },
      { text: 'Test mode included' },
      { text: '99.9% uptime SLA' },
    ],
    buttonText: 'Get started',
  },
  {
    title: 'Pro',
    tagline: 'For growing businesses and startups',
    price: '$49',
    priceSubtext: '/ per month',
    features: [
      { text: 'Unlimited subscriptions' },
      { text: 'Full API access' },
      { text: 'Priority support' },
      { text: 'Advanced webhooks' },
      { text: 'Usage-based billing' },
      { text: 'Custom billing intervals' },
    ],
    buttonText: 'Start free trial',
    isPopular: true,
    popularLabel: 'Most popular',
  },
  {
    title: 'Enterprise',
    tagline: 'Custom solutions for large organizations',
    price: 'Custom',
    priceSubtext: 'contact sales',
    features: [
      { text: 'Everything in Pro' },
      { text: 'Dedicated support team' },
      { text: 'Custom SLAs' },
      { text: 'Volume pricing' },
      { text: 'White-label options' },
      { text: 'Onboarding assistance' },
    ],
    buttonText: 'Contact sales',
  },
];

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <div
      className={`relative flex flex-col rounded-3xl border p-8 transition-all duration-300 ${
        plan.isPopular
          ? 'border-cyan-500/30 bg-slate-900/80 shadow-[0_0_40px_rgba(34,211,238,0.15)] ring-1 ring-cyan-500/20'
          : 'border-white/10 bg-slate-900/60 hover:border-white/20 shadow-xl backdrop-blur-sm'
      }`}
    >
      {plan.isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-linear-to-r from-cyan-400 to-teal-500 text-black px-4 py-1 rounded-full text-xs font-bold whitespace-nowrap z-10 shadow-[0_0_20px_rgba(34,211,238,0.4)] tracking-wide uppercase">
          {plan.popularLabel}
        </div>
      )}

      {plan.isPopular && (
        <div className="absolute -top-1/2 -right-1/2 w-[200%] h-[200%] bg-radial from-cyan-500/10 to-transparent pointer-events-none" />
      )}

      <div className="relative z-10 flex flex-col h-full">
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">
            {plan.title}
          </h3>
          <p className="text-slate-400 text-sm leading-relaxed">{plan.tagline}</p>
        </div>

        <div className="mb-8">
          <div className="flex items-baseline gap-1 flex-wrap">
            <span className="text-4xl font-bold text-white tracking-tighter">
              {plan.price}
            </span>
            <span className="text-slate-500 text-sm font-medium">
              {plan.priceSubtext}
            </span>
          </div>
        </div>

        <ul className="space-y-3 mb-8 flex-1">
          {plan.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                <Check size={12} className="text-cyan-400" />
              </div>
              <span className="text-slate-300 text-sm leading-relaxed">{feature.text}</span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className={`w-full py-3 px-6 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
            plan.isPopular
              ? 'bg-linear-to-r from-cyan-400 to-teal-500 hover:from-cyan-300 hover:to-teal-400 text-black shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] hover:-translate-y-1'
              : 'bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 hover:-translate-y-1'
          }`}
        >
          {plan.buttonText}
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}

export default function PlansCarousel() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const labelId = useId();

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const scrollTo = useCallback((index: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const card = container.children[index] as HTMLElement | undefined;
    if (!card) return;
    container.scrollTo({
      left: card.offsetLeft - container.offsetLeft,
      behavior: isReducedMotion ? 'auto' : 'smooth',
    });
    setCurrentIndex(index);
  }, [isReducedMotion]);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const scrollLeft = container.scrollLeft;
    const cardWidth = container.children[0]?.getBoundingClientRect().width ?? 0;
    const gap = 16;
    const newIndex = Math.round(scrollLeft / (cardWidth + gap));
    setCurrentIndex(Math.min(newIndex, plans.length - 1));
  }, []);

  const handlePrev = useCallback(() => {
    scrollTo(Math.max(0, currentIndex - 1));
  }, [currentIndex, scrollTo]);

  const handleNext = useCallback(() => {
    scrollTo(Math.min(plans.length - 1, currentIndex + 1));
  }, [currentIndex, scrollTo]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <section className="py-20" aria-labelledby={labelId}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 id={labelId} className="text-3xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
            Choose Your Plan
          </h2>
          <p className="text-slate-400 text-lg">
            Simple, transparent pricing for every stage of your business.
          </p>
        </div>

        {/* ===== Desktop: Grid (720px+) ===== */}
        <div
          className="hidden max-sm:hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch"
          role="list"
          aria-label="Available plans"
        >
          {plans.map((plan) => (
            <div key={plan.title} role="listitem">
              <PlanCard plan={plan} />
            </div>
          ))}
        </div>

        {/* ===== Mobile: Carousel (< 720px) ===== */}
        <div className="sm:hidden">
          <div className="relative">
            {/* Navigation Buttons */}
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-slate-800 border border-white/10 text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              aria-label="Previous plan"
            >
              <ArrowLeft size={20} />
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={currentIndex === plans.length - 1}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-slate-800 border border-white/10 text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              aria-label="Next plan"
            >
              <ArrowRight size={20} />
            </button>

            {/* Scrollable Container */}
            <div
              ref={scrollContainerRef}
              className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2"
              role="list"
              aria-label="Available plans"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft') {
                  e.preventDefault();
                  handlePrev();
                } else if (e.key === 'ArrowRight') {
                  e.preventDefault();
                  handleNext();
                }
              }}
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {plans.map((plan, index) => (
                <div
                  key={plan.title}
                  role="listitem"
                  className="min-w-[85vw] max-w-[85vw] snap-start shrink-0"
                  aria-current={index === currentIndex ? 'true' : undefined}
                >
                  <PlanCard plan={plan} />
                </div>
              ))}
            </div>

            {/* Pagination Dots */}
            <div className="flex justify-center gap-2 mt-6" role="tablist" aria-label="Plan pages">
              {plans.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  role="tab"
                  aria-selected={index === currentIndex}
                  aria-label={`Go to plan ${index + 1}`}
                  onClick={() => scrollTo(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                    index === currentIndex
                      ? 'bg-cyan-400 w-8 shadow-[0_0_8px_rgba(34,211,238,0.6)]'
                      : 'bg-slate-600 hover:bg-slate-500'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Screen-reader announcement of current plan */}
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            Showing plan {currentIndex + 1} of {plans.length}: {plans[currentIndex].title}
          </div>
        </div>
      </div>
    </section>
  );
}
