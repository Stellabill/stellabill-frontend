import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { plans as plansAPI } from '../api/client'
import WalletConnectModal from '../components/WalletConnectModal'

type PlanInterval = 'Monthly' | 'Yearly'
type SortField = 'name' | 'price' | 'merchant'
type SortDirection = 'asc' | 'desc'

interface Plan {
  id: string
  merchant: string
  name: string
  price: number
  currency: string
  interval: PlanInterval
  description: string
  icon: 'newspaper' | 'cloud' | 'robot' | 'muscle' | 'fitness' | 'chart'
}

// Icon Components
const NewspaperIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
    <path d="M18 14h-8" />
    <path d="M15 18h-5" />
    <path d="M10 6h8v4h-8V6Z" />
  </svg>
)

const CloudIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
  </svg>
)

const RobotIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="10" x="3" y="11" rx="2" />
    <circle cx="12" cy="5" r="2" />
    <path d="M12 7v4" />
    <line x1="8" x2="8" y1="16" y2="16" />
    <line x1="16" x2="16" y1="16" y2="16" />
  </svg>
)

const MuscleIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.5 3.5a3 3 0 0 1 0 6M13.5 3.5a3 3 0 0 0 0 6" />
    <path d="M13.5 9.5V14" />
    <path d="M12.5 14v5.5a3 3 0 0 1-6 0v-2c0-1.7 1.3-3 3-3 1.7 0 3-1.3 3-3Z" />
  </svg>
)

const FitnessIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m14 7 6-3v18l-6-3" />
    <path d="M4 4v16" />
    <path d="M10 7l-6-3v18l6-3" />
  </svg>
)

const ChartIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18" />
    <path d="m19 9-5 5-4-4-3 3" />
  </svg>
)

const iconMap = {
  newspaper: NewspaperIcon,
  cloud: CloudIcon,
  robot: RobotIcon,
  muscle: MuscleIcon,
  fitness: FitnessIcon,
  chart: ChartIcon,
}

// Mock data matching design requirements
const mockPlans: Plan[] = [
  {
    id: '1',
    merchant: 'Stellar News',
    name: 'Premium Access',
    price: 10,
    currency: 'USDC',
    interval: 'Monthly',
    description: 'Get unlimited access to premium articles, exclusive interviews, and breaking news coverage.',
    icon: 'newspaper',
  },
  {
    id: '2',
    merchant: 'CloudFlow',
    name: 'Pro Plan',
    price: 25,
    currency: 'USDC',
    interval: 'Monthly',
    description: 'Advanced cloud storage with 1TB space, priority support, and team collaboration features.',
    icon: 'cloud',
  },
  {
    id: '3',
    merchant: 'DevTools AI',
    name: 'Starter',
    price: 15,
    currency: 'USDC',
    interval: 'Monthly',
    description: 'AI-powered development tools with code completion, debugging, and documentation generation.',
    icon: 'robot',
  },
  {
    id: '4',
    merchant: 'Stellar News',
    name: 'Annual Premium',
    price: 100,
    currency: 'USDC',
    interval: 'Yearly',
    description: 'Full year of premium access at a discounted rate. Save 17% compared to monthly billing.',
    icon: 'newspaper',
  },
  {
    id: '5',
    merchant: 'CloudFlow',
    name: 'Enterprise',
    price: 50,
    currency: 'USDC',
    interval: 'Monthly',
    description: 'Unlimited storage, advanced security, dedicated support, and custom integrations for teams.',
    icon: 'cloud',
  },
  {
    id: '6',
    merchant: 'FitTrack',
    name: 'Premium Coaching',
    price: 30,
    currency: 'USDC',
    interval: 'Monthly',
    description: 'Personal fitness coaching with custom workout plans, nutrition tracking, and weekly check-ins.',
    icon: 'fitness',
  },
]

// Plan Card Component
interface PlanCardProps {
  plan: Plan
  onSubscribe: (plan: Plan) => void
}

function PlanCard({ plan, onSubscribe }: PlanCardProps) {
  const IconComponent = iconMap[plan.icon]
  const [isHovered, setIsHovered] = useState(false)

  return (
    <article
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: '#161B22',
        borderRadius: 16,
        padding: '24px',
        border: '1px solid #30363D',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        boxShadow: isHovered
          ? '0 12px 24px rgba(0, 0, 0, 0.4), 0 0 20px rgba(79, 209, 197, 0.15)'
          : '0 4px 6px rgba(0, 0, 0, 0.1)',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
      }}
    >
      {/* Icon and Merchant */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: 'rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            flexShrink: 0,
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <IconComponent />
        </div>
        <span style={{ color: '#8b949e', fontSize: '14px', fontWeight: 500 }}>
          {plan.merchant}
        </span>
      </div>

      {/* Plan Name */}
      <h3
        style={{
          color: '#ffffff',
          fontSize: '22px',
          fontWeight: 700,
          margin: 0,
          lineHeight: 1.2,
        }}
      >
        {plan.name}
      </h3>

      {/* Price */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <span
          style={{
            color: '#ffffff',
            fontSize: '36px',
            fontWeight: 800,
          }}
        >
          {plan.price}
        </span>
        <span style={{ color: '#8b949e', fontSize: '16px', fontWeight: 500 }}>
          {plan.currency} / {plan.interval === 'Monthly' ? 'mo' : 'yr'}
        </span>
      </div>

      {/* Description */}
      <p
        style={{
          color: '#8b949e',
          fontSize: '15px',
          lineHeight: 1.55,
          margin: 0,
          flex: 1,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {plan.description}
      </p>

      {/* Subscribe Button */}
      <button
        onClick={() => onSubscribe(plan)}
        style={{
          width: '100%',
          padding: '14px 20px',
          background: 'linear-gradient(90deg, #4FD1C5 0%, #38B2AC 100%)',
          color: '#0D1117',
          fontSize: '16px',
          fontWeight: 700,
          border: 'none',
          borderRadius: 12,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: isHovered ? '0 4px 12px rgba(79, 209, 197, 0.3)' : 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.filter = 'brightness(1.1)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.filter = 'brightness(1)'
        }}
        onFocus={(e) => {
          e.currentTarget.style.outline = '2px solid #22d3ee'
          e.currentTarget.style.outlineOffset = '2px'
        }}
        onBlur={(e) => {
          e.currentTarget.style.outline = 'none'
        }}
        aria-label={`Subscribe to ${plan.name} plan for ${plan.price} ${plan.currency} per ${plan.interval === 'Monthly' ? 'month' : 'year'} from ${plan.merchant}`}
      >
        Subscribe
      </button>
    </article>
  )
}

// Main BrowsePlans Component
export default function BrowsePlans() {
  const navigate = useNavigate()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [intervalFilter, setIntervalFilter] = useState<PlanInterval | 'All'>('All')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [isWalletConnected, setIsWalletConnected] = useState(false)
  const [walletModalOpen, setWalletModalOpen] = useState(false)

  // Fetch plans from API
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true)
        const response = await plansAPI.list()
        setPlans(response.plans as Plan[])
        setError(null)
      } catch (err) {
        setError('Failed to load plans')
        console.error('Error fetching plans:', err)
        // Fallback to mock data on error
        setPlans(mockPlans)
      } finally {
        setLoading(false)
      }
    }
    fetchPlans()
  }, [])

  // Filtered and sorted plans
  const filteredPlans = useMemo(() => {
    let result = plans.filter((plan) => {
      const matchesSearch =
        plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesInterval = intervalFilter === 'All' || plan.interval === intervalFilter
      return matchesSearch && matchesInterval
    })

    // Sort
    result.sort((a, b) => {
      let comparison = 0
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name)
      } else if (sortField === 'price') {
        comparison = a.price - b.price
      } else if (sortField === 'merchant') {
        comparison = a.merchant.localeCompare(b.merchant)
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })

    return result
  }, [plans, searchQuery, intervalFilter, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleSubscribe = (plan: Plan) => {
    if (!isWalletConnected) {
      setWalletModalOpen(true)
      return
    }
    // Navigate to checkout/subscribe flow
    navigate(`/checkout/${plan.id}`)
  }

  const handleWalletConnect = () => {
    setIsWalletConnected(true)
    setWalletModalOpen(false)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setIntervalFilter('All')
    setSortField('name')
    setSortDirection('asc')
  }

  return (
    <div style={{ padding: '2rem', background: '#0a0a0a', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1
            style={{
              color: '#ffffff',
              fontSize: '2rem',
              fontWeight: 700,
              margin: '0 0 0.5rem',
            }}
          >
            Browse Plans
          </h1>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '1rem' }}>
            Discover subscription plans from verified merchants on Stellar
          </p>
        </div>

        {/* Filters and Sort */}
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '2rem',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          {/* Search */}
          <div style={{ flex: '1 1 300px', position: 'relative' }}>
            <svg
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '18px',
                height: '18px',
                color: '#64748b',
              }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="search"
              placeholder="Search plans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 2.5rem',
                background: '#1a1a1a',
                border: '1px solid #2a2a2a',
                borderRadius: 8,
                color: '#ffffff',
                fontSize: '0.875rem',
                outline: 'none',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#22d3ee')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#2a2a2a')}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  clearFilters()
                }
              }}
              aria-label="Search plans by name, merchant, or description"
            />
          </div>

          {/* Interval Filter */}
          <select
            value={intervalFilter}
            onChange={(e) => setIntervalFilter(e.target.value as PlanInterval | 'All')}
            style={{
              padding: '0.75rem 1rem',
              background: '#1a1a1a',
              border: '1px solid #2a2a2a',
              borderRadius: 8,
              color: '#ffffff',
              fontSize: '0.875rem',
              cursor: 'pointer',
              outline: 'none',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#22d3ee')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#2a2a2a')}
            aria-label="Filter plans by billing interval (Monthly or Yearly)"
          >
            <option value="All">All Plans</option>
            <option value="Monthly">Monthly</option>
            <option value="Yearly">Yearly</option>
          </select>

          {/* Sort */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Sort by:</span>
            <button
              onClick={() => handleSort('name')}
              style={{
                padding: '0.5rem 1rem',
                background: sortField === 'name' ? '#2a2a2a' : 'transparent',
                border: '1px solid #2a2a2a',
                borderRadius: 6,
                color: sortField === 'name' ? '#22d3ee' : '#94a3b8',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSort('price')}
              style={{
                padding: '0.5rem 1rem',
                background: sortField === 'price' ? '#2a2a2a' : 'transparent',
                border: '1px solid #2a2a2a',
                borderRadius: 6,
                color: sortField === 'price' ? '#22d3ee' : '#94a3b8',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Price {sortField === 'price' && (sortDirection === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSort('merchant')}
              style={{
                padding: '0.5rem 1rem',
                background: sortField === 'merchant' ? '#2a2a2a' : 'transparent',
                border: '1px solid #2a2a2a',
                borderRadius: 6,
                color: sortField === 'merchant' ? '#22d3ee' : '#94a3b8',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Merchant {sortField === 'merchant' && (sortDirection === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        </div>

        {/* Results count */}
        <div style={{ marginBottom: '1.5rem' }}>
          <span style={{ color: '#64748b', fontSize: '0.875rem' }}>
            {filteredPlans.length} {filteredPlans.length === 1 ? 'plan' : 'plans'} found
          </span>
        </div>

        {/* Loading State */}
        {loading && (
          <div
            style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              background: '#1a1a1a',
              borderRadius: 12,
              border: '1px solid #2a2a2a',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                margin: '0 auto 1.5rem',
                borderRadius: '50%',
                border: '3px solid #2a2a2a',
                borderTopColor: '#22d3ee',
                animation: 'spin 1s linear infinite',
              }}
            />
            <h2 style={{ color: '#ffffff', fontSize: '1.5rem', margin: '0 0 0.5rem' }}>
              Loading plans...
            </h2>
            <p style={{ color: '#94a3b8', margin: 0 }}>
              Please wait while we fetch available subscription plans
            </p>
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div
            style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              background: '#1a1a1a',
              borderRadius: 12,
              border: '1px solid #ef4444',
              borderLeftWidth: '4px',
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                margin: '0 auto 1.5rem',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444',
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 style={{ color: '#ffffff', fontSize: '1.5rem', margin: '0 0 0.5rem' }}>
              {error}
            </h2>
            <p style={{ color: '#94a3b8', margin: '0 0 1.5rem' }}>
              Showing cached data. Please try again or contact support.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)',
                color: '#ffffff',
                fontSize: '0.875rem',
                fontWeight: 600,
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Grid or Empty State */}
        {!loading && filteredPlans.length > 0 && (
          <div
            role="list"
            aria-label="Available subscription plans"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '24px 32px',
            }}
          >
            {filteredPlans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} onSubscribe={handleSubscribe} />
            ))}
          </div>
        ) : !loading && filteredPlans.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              background: '#1a1a1a',
              borderRadius: 12,
              border: '1px solid #2a2a2a',
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                margin: '0 auto 1.5rem',
                borderRadius: '50%',
                background: 'rgba(34, 211, 238, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#22d3ee',
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
            <h2 style={{ color: '#ffffff', fontSize: '1.5rem', margin: '0 0 0.5rem' }}>
              No plans match your filters
            </h2>
            <p style={{ color: '#94a3b8', margin: '0 0 1.5rem' }}>
              Try adjusting your search criteria or browse all plans
            </p>
            <button
              onClick={clearFilters}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)',
                color: '#ffffff',
                fontSize: '0.875rem',
                fontWeight: 600,
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              Clear Filters
            </button>
          </div>
        ) : null}

        {/* Wallet Connect Modal */}
        <WalletConnectModal
          isOpen={walletModalOpen}
          onClose={() => setWalletModalOpen(false)}
        />
      </div>
    </div>
  )
}
