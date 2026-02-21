import { Bot, ChevronDown, Cloud, Dumbbell, Home, Newspaper } from 'lucide-react'
import { useMemo, useState } from 'react'
import Breadcrumb from '../components/Breadcrumb'
import Footer from '../components/Footer'
import PlanCard from '../components/PlanCard'
import SortBySelect from '../components/SortBySelect'

const plans = [
  {
    id: 'stellar-news-premium-access',
    merchant: 'Stellar News',
    merchantIcon: Newspaper,
    planName: 'Premium Access',
    price: 10,
    interval: 'mo',
    createdAt: '2026-01-20',
    description: 'Unlimited access to premium articles, daily market analysis, and exclusive interviews.',
  },
  {
    id: 'cloudflow-pro-plan',
    merchant: 'CloudFlow',
    merchantIcon: Cloud,
    planName: 'Pro Plan',
    price: 25,
    interval: 'mo',
    createdAt: '2026-01-18',
    description: 'Advanced cloud storage with 1TB space, priority support, and team collaboration.',
  },
  {
    id: 'devtools-ai-starter',
    merchant: 'DevTools AI',
    merchantIcon: Bot,
    planName: 'Starter',
    price: 15,
    interval: 'mo',
    createdAt: '2026-01-22',
    description: 'API access with 10,000 requests/month, webhook support, and community support.',
    usageTag: 'Usage-based',
  },
  {
    id: 'stellar-news-annual-premium',
    merchant: 'Stellar News',
    merchantIcon: Newspaper,
    planName: 'Annual Premium',
    price: 100,
    interval: 'yr',
    createdAt: '2026-01-10',
    description: 'Save 17% with annual billing. All premium features with priority support.',
  },
  {
    id: 'cloudflow-enterprise',
    merchant: 'CloudFlow',
    merchantIcon: Cloud,
    planName: 'Enterprise',
    price: 50,
    interval: 'mo',
    createdAt: '2026-01-12',
    description: 'Unlimited storage, dedicated support, custom integrations, and SLA guarantee.',
  },
  {
    id: 'fittrack-premium-coaching',
    merchant: 'FitTrack',
    merchantIcon: Dumbbell,
    planName: 'Premium Coaching',
    price: 30,
    interval: 'mo',
    createdAt: '2026-01-16',
    description: 'Personalized workout plans, nutrition tracking, and weekly video coaching sessions.',
  },
]

type BillingInterval = 'all' | 'monthly' | 'yearly'

export default function BrowserPlan() {
  const [merchantFilter, setMerchantFilter] = useState('all')
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('all')
  const [sortBy, setSortBy] = useState('newest')

  const merchantOptions = useMemo(() => {
    const uniqueMerchants = Array.from(new Set(plans.map((plan) => plan.merchant)))
    return ['All merchants', ...uniqueMerchants]
  }, [])

  const visiblePlans = useMemo(() => {
    const filtered = plans.filter((plan) => {
      const matchesMerchant = merchantFilter === 'all' || plan.merchant === merchantFilter
      const matchesInterval =
        billingInterval === 'all' ||
        (billingInterval === 'monthly' && plan.interval === 'mo') ||
        (billingInterval === 'yearly' && plan.interval === 'yr')

      return matchesMerchant && matchesInterval
    })

    return [...filtered].sort((a, b) => {
      if (sortBy === 'price-low') {
        return a.price - b.price
      }
      if (sortBy === 'price-high') {
        return b.price - a.price
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [billingInterval, merchantFilter, sortBy])

  return (
    <main className="browse-page">
      <section className="browse-page__hero">
        <Breadcrumb
          items={[
            { label: 'Home', to: '/', icon: <Home size={14} /> },
            { label: 'Browse plans' },
          ]}
        />
        <h1>Browse plans</h1>
        <p className="browse-page__subtitle">
          Choose a plan and pay with USDC. Your balance is held securely in a smart contract.
        </p>
      </section>

      <section className="browse-filters" aria-label="Plan filters">
        <div className="browse-filter">
          <label htmlFor="merchant">Merchant</label>
          <div className="browse-select">
            <select
              id="merchant"
              value={merchantFilter}
              onChange={(event) => {
                const selectedMerchant = event.target.value
                setMerchantFilter(selectedMerchant === 'all' ? 'all' : selectedMerchant)
              }}
            >
              {merchantOptions.map((merchant) => (
                <option key={merchant} value={merchant === 'All merchants' ? 'all' : merchant}>
                  {merchant}
                </option>
              ))}
            </select>
            <span>
              <ChevronDown size={16} />
            </span>
          </div>
        </div>

        <div className="browse-filter">
          <label>Billing interval</label>
          <div className="browse-segment" role="group" aria-label="Billing interval">
            <button
              type="button"
              className={billingInterval === 'all' ? 'is-active' : ''}
              aria-pressed={billingInterval === 'all'}
              onClick={() => setBillingInterval('all')}
            >
              All
            </button>
            <button
              type="button"
              className={billingInterval === 'monthly' ? 'is-active' : ''}
              aria-pressed={billingInterval === 'monthly'}
              onClick={() => setBillingInterval('monthly')}
            >
              Monthly
            </button>
            <button
              type="button"
              className={billingInterval === 'yearly' ? 'is-active' : ''}
              aria-pressed={billingInterval === 'yearly'}
              onClick={() => setBillingInterval('yearly')}
            >
              Yearly
            </button>
          </div>
        </div>

        <div className="browse-filter">
          <label id="sort-label">Sort by</label>
          <SortBySelect value={sortBy} onValueChange={setSortBy} labelId="sort-label" />
        </div>
      </section>

      <p className="browse-count">Showing {visiblePlans.length} plans</p>

      <section className="browse-grid" aria-label="Plan results">
        {visiblePlans.map((plan) => (
          <PlanCard
            key={plan.id}
            merchant={plan.merchant}
            merchantIcon={plan.merchantIcon}
            planName={plan.planName}
            price={String(plan.price)}
            interval={plan.interval}
            description={plan.description}
            usageTag={plan.usageTag}
          />
        ))}
      </section>

      <Footer />
    </main>
  )
}
