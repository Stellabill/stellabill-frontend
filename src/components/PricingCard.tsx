import { ArrowRight, Check } from 'lucide-react';

interface Feature {
  text: string
}

interface PricingCardProps {
  title: string
  tagline: string
  price?: string
  priceLabel?: string
  priceSubtext?: string
  features: Feature[]
  buttonText: string
  buttonArrow?: boolean
  onButtonClick?: () => void
  isPopular?: boolean
  isPopularLabel?: string
  useGradientButton?: boolean
  /**
   * Base price per seat (number). When provided together with `seats > 0`
   * and `pricingMode === 'per-seat'`, the card shows the per-seat rate and
   * a total line below it. Set to `null` to indicate custom/contact pricing.
   */
  basePricePerSeat?: number | null
  /** Current pricing mode driven by the page-level toggle. */
  pricingMode?: 'flat' | 'per-seat'
  /** Current seat count driven by the page-level stepper. */
  seats?: number
}

export default function PricingCard({
  title,
  tagline,
  price,
  priceLabel,
  priceSubtext,
  features,
  buttonText,
  buttonArrow = true,
  onButtonClick,
  isPopular = false,
  isPopularLabel = 'Most popular',
  useGradientButton = false,
  basePricePerSeat,
  pricingMode = 'flat',
  seats = 1,
}: PricingCardProps) {
  // ── Derive displayed price strings ──────────────────────────────────────
  const isPerSeat = pricingMode === 'per-seat' && basePricePerSeat != null
  const isCustom = basePricePerSeat === null

  const displayPrice: string | undefined = (() => {
    if (isCustom) return undefined
    if (isPerSeat && typeof basePricePerSeat === 'number') {
      return `$${basePricePerSeat}`
    }
    return price
  })()

  const displaySubtext: string | undefined = (() => {
    if (isPerSeat && typeof basePricePerSeat === 'number' && seats > 0) {
      const total = basePricePerSeat * seats
      return `$${total.toLocaleString('en-US')} / mo total for ${seats} seat${seats !== 1 ? 's' : ''}`
    }
    return priceSubtext
  })()

  const perSeatLabel = isPerSeat ? '/ seat / mo' : '/mo'
  return (
    <div className="relative flex-1 min-w-[300px] max-w-[380px] h-full group">
      {/* Most popular tag */}
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-linear-to-r from-cyan-400 to-teal-500 text-black px-4 py-1 rounded-full text-xs font-bold whitespace-nowrap z-10 shadow-[0_0_20px_rgba(34,211,238,0.4)] tracking-wide uppercase">
          {isPopularLabel}
        </div>
      )}

      {/* Card container */}
      <div
        className={`bg-slate-900/60 backdrop-blur-sm rounded-3xl p-8 flex flex-col h-full relative overflow-hidden transition-all duration-300 border ${
          isPopular 
            ? "border-cyan-500/30 shadow-[0_0_40px_rgba(34,211,238,0.15)] ring-1 ring-cyan-500/20" 
            : "border-white/10 hover:border-white/20 shadow-xl"
        }`}
      >
        {/* Glowing background effect for Pro card */}
        {isPopular && (
          <div className="absolute -top-1/2 -right-1/2 w-[200%] h-[200%] bg-radial from-cyan-500/10 to-transparent pointer-events-none" />
        )}

        <div className="relative z-10 flex flex-col h-full">
          {/* Header */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">
              {title}
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed h-10">
              {tagline}
            </p>
          </div>

          {/* Price Section */}
          <div className="mb-10">
            {isCustom ? (
              /* Custom / Enterprise: show the priceLabel fallback */
              priceLabel ? (
                <div className="flex flex-col gap-1">
                  <p className="text-4xl font-bold text-white tracking-tight">{priceLabel}</p>
                  {priceSubtext && (
                    <p className="text-slate-500 text-sm">{priceSubtext}</p>
                  )}
                </div>
              ) : null
            ) : displayPrice !== undefined ? (
              <div className="flex flex-col gap-1">
                <div className="flex items-baseline gap-1 flex-wrap">
                  <span
                    className="text-5xl font-bold text-white tracking-tighter transition-all duration-300"
                    key={`${pricingMode}-${seats}`}
                    style={{ willChange: 'opacity' }}
                  >
                    {displayPrice}
                  </span>
                  <span className="text-slate-500 text-sm font-medium">
                    {perSeatLabel}
                  </span>
                </div>
                {displaySubtext && (
                  <p
                    className="text-slate-500 text-sm transition-all duration-300"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    {displaySubtext}
                  </p>
                )}
              </div>
            ) : priceLabel ? (
              <div className="flex flex-col gap-1">
                <p className="text-4xl font-bold text-white tracking-tight">{priceLabel}</p>
                {priceSubtext && (
                  <p className="text-slate-500 text-sm">{priceSubtext}</p>
                )}
              </div>
            ) : null}
          </div>

          {/* Features List */}
          <ul className="space-y-4 mb-12 flex-1">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                  <Check size={12} className="text-cyan-400" />
                </div>
                <span className="text-slate-300 text-sm leading-relaxed">{feature.text}</span>
              </li>
            ))}
          </ul>

          {/* CTA Button */}
          <button
            onClick={onButtonClick}
            className={`w-full py-4 px-6 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 group/btn print:hidden ${
              useGradientButton
                ? "bg-linear-to-r from-cyan-400 to-teal-500 hover:from-cyan-300 hover:to-teal-400 text-black shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] transform hover:-translate-y-1"
                : "bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 transform hover:-translate-y-1"
            }`}
          >
            {buttonText}
            {buttonArrow && (
              <ArrowRight size={18} className="transform group-hover/btn:translate-x-1 transition-transform" />
            )}
          </button>

          {/* Print CTA */}
          <div className="hidden print:block text-slate-800 text-center mt-4 font-semibold text-sm">
            stellabill.com/contact
          </div>
        </div>
      </div>
    </div>
  )
}
