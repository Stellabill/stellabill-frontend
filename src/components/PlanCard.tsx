import type { LucideIcon } from 'lucide-react'

export type PlanCardProps = {
  merchant: string
  merchantIcon: LucideIcon
  planName: string
  price: string
  interval: string
  description: string
  usageTag?: string
}

export default function PlanCard({
  merchant,
  merchantIcon: MerchantIcon,
  planName,
  price,
  interval,
  description,
  usageTag,
}: PlanCardProps) {
  return (
    <article className="plan-card">
      <div className="plan-card__merchant-row">
        <span className="plan-card__merchant-icon">
          <MerchantIcon size={18} strokeWidth={1.9} />
        </span>
        <span className="plan-card__merchant">{merchant}</span>
        {usageTag && <span className="plan-card__tag">{usageTag}</span>}
      </div>

      <h3 className="plan-card__title">{planName}</h3>
      <p className="plan-card__price">
        <strong>{price}</strong> USDC <span>/ {interval}</span>
      </p>
      <p className="plan-card__description">{description}</p>

      <button type="button" className="plan-card__button">
        Subscribe
      </button>
    </article>
  )
}
