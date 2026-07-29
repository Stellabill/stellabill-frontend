import { useNavigate } from 'react-router-dom'
import { useDraftManager } from '../hooks/useDraftManager'
import './Plans.css'

function formatTimestamp(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

function pricePreview(data: { pricing: { price: string; interval: string; priceType: string } }): string {
  const { price, interval, priceType } = data.pricing
  if (!price && !interval) return 'Not configured'
  const symbol = priceType === 'percent' ? '%' : '$'
  const intervalLabel = interval ? `/${interval.toLowerCase()}` : ''
  return `${symbol}${price || '0'}${intervalLabel}`
}

export default function Plans() {
  const navigate = useNavigate()
  const { drafts, deleteDraft } = useDraftManager()

  return (
    <div className="plans-page">
      <h1>Plans</h1>
      <p className="plans-page__description">
        Define billing plans and pricing. Sync with the backend and on-chain
        contract configuration.
      </p>

      {drafts.length > 0 && (
        <section style={{ marginBottom: '2rem' }}>
          <h2
            style={{
              color: '#e2e8f0',
              fontSize: '1rem',
              fontWeight: 600,
              margin: '0 0 0.75rem 0',
            }}
          >
            Continue where you left off
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {drafts.map((draft, index) => (
              <div
                key={draft.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  padding: '1rem 1.25rem',
                  background: '#121212',
                  border: '1px solid #2a2a2a',
                  borderRadius: '10px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ color: '#e2e8f0', fontSize: '0.875rem', fontWeight: 600 }}>
                    Draft saved {formatTimestamp(draft.savedAt)}
                  </span>
                  <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
                    {draft.data.usageEnabled ? 'Usage-based' : 'Flat-rate'} &middot; {pricePreview(draft.data)}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => deleteDraft(draft.id)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'none',
                      border: '1px solid #3a3a3a',
                      borderRadius: '8px',
                      color: '#e2e8f0',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#555' }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#3a3a3a' }}
                  >
                    Delete Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/plans/create?draftId=${draft.id}`)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'linear-gradient(135deg, #38bcd4 0%, #4dd8e1 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#000',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88' }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
                  >
                    Continue
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="plans-page__empty-card">
        <p>No plans configured. Add plans via API or UI form.</p>
      </div>
    </div>
  )
}
