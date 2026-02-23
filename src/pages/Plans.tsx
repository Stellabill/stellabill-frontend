import { useState, useMemo, useEffect } from 'react'

type PlanStatus = 'Active' | 'Archived'
type PlanInterval = 'Monthly' | 'Yearly'
type SortField = 'name' | 'price' | 'subscriptions'
type SortDirection = 'asc' | 'desc'

interface Plan {
  id: string
  name: string
  price: number
  currency: string
  interval: PlanInterval
  usageBased: boolean
  subscriptions: number
  status: PlanStatus
}

// Mock data - replace with API call
const mockPlans: Plan[] = [
  { id: '1', name: 'Pro Plan', price: 25, currency: 'USDC', interval: 'Monthly', usageBased: false, subscriptions: 12, status: 'Active' },
  { id: '2', name: 'Basic Plan', price: 10, currency: 'USDC', interval: 'Monthly', usageBased: false, subscriptions: 24, status: 'Active' },
  { id: '3', name: 'Enterprise Plan', price: 100, currency: 'USDC', interval: 'Monthly', usageBased: true, subscriptions: 5, status: 'Active' },
  { id: '4', name: 'Annual Pro', price: 250, currency: 'USDC', interval: 'Yearly', usageBased: false, subscriptions: 8, status: 'Active' },
  { id: '5', name: 'Starter (Legacy)', price: 5, currency: 'USDC', interval: 'Monthly', usageBased: false, subscriptions: 0, status: 'Archived' },
]

export default function Plans() {
  const [plans] = useState<Plan[]>(mockPlans)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<PlanStatus | 'All'>('All')
  const [intervalFilter, setIntervalFilter] = useState<PlanInterval | 'All'>('All')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const filteredPlans = useMemo(() => {
    let result = plans.filter(plan => {
      const matchesSearch = plan.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'All' || plan.status === statusFilter
      const matchesInterval = intervalFilter === 'All' || plan.interval === intervalFilter
      return matchesSearch && matchesStatus && matchesInterval
    })

    // Sort
    result.sort((a, b) => {
      let comparison = 0
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name)
      } else if (sortField === 'price') {
        comparison = a.price - b.price
      } else if (sortField === 'subscriptions') {
        comparison = a.subscriptions - b.subscriptions
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })

    return result
  }, [plans, searchQuery, statusFilter, intervalFilter, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleEdit = (planId: string) => {
    console.log('Edit plan:', planId)
    // Navigate to edit page or open modal
  }

  const handleDelete = (planId: string) => {
    if (deleteConfirm === planId) {
      console.log('Delete plan:', planId)
      // Call API to delete
      setDeleteConfirm(null)
    } else {
      setDeleteConfirm(planId)
    }
  }

  return (
    <div style={{ padding: '1.5rem 2rem', background: '#0a0a0a', minHeight: '100vh' }}>
      {/* Search and Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ flex: '1', minWidth: '300px', position: 'relative' }}>
          <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#64748b' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search plans…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem 0.75rem 2.5rem',
              background: '#1a1a1a',
              border: '1px solid #2a2a2a',
              borderRadius: '8px',
              color: '#e2e8f0',
              fontSize: '0.875rem',
              outline: 'none'
            }}
          />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PlanStatus | 'All')}
            style={{
              padding: '0.75rem 2.5rem 0.75rem 2.5rem',
              background: '#1a1a1a',
              border: '1px solid #2a2a2a',
              borderRadius: '8px',
              color: '#e2e8f0',
              fontSize: '0.875rem',
              cursor: 'pointer',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'left 0.75rem center',
              backgroundSize: '16px',
              appearance: 'none'
            }}
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Archived">Archived</option>
          </select>

          <select
            value={intervalFilter}
            onChange={(e) => setIntervalFilter(e.target.value as PlanInterval | 'All')}
            style={{
              padding: '0.75rem 2.5rem 0.75rem 2.5rem',
              background: '#1a1a1a',
              border: '1px solid #2a2a2a',
              borderRadius: '8px',
              color: '#e2e8f0',
              fontSize: '0.875rem',
              cursor: 'pointer',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'left 0.75rem center',
              backgroundSize: '16px',
              appearance: 'none'
            }}
          >
            <option value="All">All Intervals</option>
            <option value="Monthly">Monthly</option>
            <option value="Yearly">Yearly</option>
          </select>
        </div>
      </div>

      {/* Plans Count */}
      <div style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1rem' }}>
        {filteredPlans.length} {filteredPlans.length === 1 ? 'plan' : 'plans'}
      </div>

      {/* Table */}
      <div style={{ background: '#1a1a1a', borderRadius: '12px', border: '1px solid #2a2a2a', overflow: 'hidden' }}>
        {!isMobile ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2a2a2a' }}>
                  <th 
                    onClick={() => handleSort('name')}
                    style={{ 
                      padding: '1rem', 
                      textAlign: 'left', 
                      color: '#64748b', 
                      fontSize: '0.75rem', 
                      fontWeight: 500, 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.05em',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      Plan name
                      {sortField === 'name' && (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" style={{ transform: sortDirection === 'desc' ? 'rotate(180deg)' : 'none' }}>
                          <path d="M6 3L9 7H3L6 3Z" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('price')}
                    style={{ 
                      padding: '1rem', 
                      textAlign: 'left', 
                      color: '#64748b', 
                      fontSize: '0.75rem', 
                      fontWeight: 500, 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.05em',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      Price
                      {sortField === 'price' && (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" style={{ transform: sortDirection === 'desc' ? 'rotate(180deg)' : 'none' }}>
                          <path d="M6 3L9 7H3L6 3Z" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#64748b', fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Interval</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#64748b', fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Usage-based</th>
                  <th 
                    onClick={() => handleSort('subscriptions')}
                    style={{ 
                      padding: '1rem', 
                      textAlign: 'left', 
                      color: '#64748b', 
                      fontSize: '0.75rem', 
                      fontWeight: 500, 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.05em',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      Subscriptions
                      {sortField === 'subscriptions' && (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" style={{ transform: sortDirection === 'desc' ? 'rotate(180deg)' : 'none' }}>
                          <path d="M6 3L9 7H3L6 3Z" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#64748b', fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'right', color: '#64748b', fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlans.map((plan) => (
                  <tr key={plan.id} style={{ borderBottom: '1px solid #2a2a2a' }}>
                    <td style={{ padding: '1rem', color: '#e2e8f0', fontWeight: 600 }}>{plan.name}</td>
                    <td style={{ padding: '1rem', color: '#e2e8f0' }}>
                      {plan.price} {plan.currency}/{plan.interval === 'Monthly' ? 'mo' : 'yr'}
                    </td>
                    <td style={{ padding: '1rem', color: '#94a3b8' }}>{plan.interval}</td>
                    <td style={{ padding: '1rem', color: plan.usageBased ? '#3b82f6' : '#94a3b8', fontWeight: plan.usageBased ? 500 : 400 }}>
                      {plan.usageBased ? 'Yes' : 'No'}
                    </td>
                    <td style={{ padding: '1rem', color: '#e2e8f0' }}>{plan.subscriptions}</td>
                    <td style={{ padding: '1rem' }}>
                      {plan.status === 'Active' ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          padding: '0.25rem 0.75rem',
                          background: '#10b98120',
                          color: '#10b981',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 500
                        }}>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" />
                            <path d="M3.5 6L5.5 8L8.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Active
                        </span>
                      ) : (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          padding: '0.25rem 0.75rem',
                          background: '#64748b20',
                          color: '#94a3b8',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 500
                        }}>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                          Archived
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleEdit(plan.id)}
                          style={{
                            padding: '0.5rem',
                            background: 'transparent',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#2a2a2a'
                            e.currentTarget.style.color = '#e2e8f0'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent'
                            e.currentTarget.style.color = '#94a3b8'
                          }}
                          aria-label="Edit plan"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        {plan.status === 'Active' && (
                          <button
                            onClick={() => handleDelete(plan.id)}
                            style={{
                              padding: '0.5rem',
                              background: deleteConfirm === plan.id ? '#dc262620' : 'transparent',
                              border: deleteConfirm === plan.id ? '1px solid #dc2626' : 'none',
                              color: deleteConfirm === plan.id ? '#dc2626' : '#94a3b8',
                              cursor: 'pointer',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              if (deleteConfirm !== plan.id) {
                                e.currentTarget.style.background = '#2a2a2a'
                                e.currentTarget.style.color = '#e2e8f0'
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (deleteConfirm !== plan.id) {
                                e.currentTarget.style.background = 'transparent'
                                e.currentTarget.style.color = '#94a3b8'
                              }
                            }}
                            aria-label={deleteConfirm === plan.id ? 'Click again to confirm deletion' : 'Delete plan'}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Mobile Card View */
          <div style={{ padding: '1rem' }}>
            {filteredPlans.map((plan) => (
              <div key={plan.id} style={{ 
                background: '#0a0a0a', 
                border: '1px solid #2a2a2a', 
                borderRadius: '8px', 
                padding: '1rem',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>{plan.name}</div>
                    <div style={{ color: '#e2e8f0', fontSize: '0.875rem' }}>
                      {plan.price} {plan.currency}/{plan.interval === 'Monthly' ? 'mo' : 'yr'}
                    </div>
                  </div>
                  {plan.status === 'Active' ? (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      padding: '0.25rem 0.75rem',
                      background: '#10b98120',
                      color: '#10b981',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 500
                    }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M3.5 6L5.5 8L8.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Active
                    </span>
                  ) : (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      padding: '0.25rem 0.75rem',
                      background: '#64748b20',
                      color: '#94a3b8',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 500
                    }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                      Archived
                    </span>
                  )}
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Interval</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>{plan.interval}</div>
                  </div>
                  <div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Usage-based</div>
                    <div style={{ color: plan.usageBased ? '#3b82f6' : '#94a3b8', fontSize: '0.875rem', fontWeight: plan.usageBased ? 500 : 400 }}>
                      {plan.usageBased ? 'Yes' : 'No'}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Subscriptions</div>
                    <div style={{ color: '#e2e8f0', fontSize: '0.875rem' }}>{plan.subscriptions}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid #2a2a2a' }}>
                  <button
                    onClick={() => handleEdit(plan.id)}
                    style={{
                      flex: 1,
                      padding: '0.625rem',
                      background: '#2a2a2a',
                      border: 'none',
                      color: '#e2e8f0',
                      cursor: 'pointer',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: 500
                    }}
                    aria-label="Edit plan"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                  {plan.status === 'Active' && (
                    <button
                      onClick={() => handleDelete(plan.id)}
                      style={{
                        flex: 1,
                        padding: '0.625rem',
                        background: deleteConfirm === plan.id ? '#dc262620' : '#2a2a2a',
                        border: deleteConfirm === plan.id ? '1px solid #dc2626' : 'none',
                        color: deleteConfirm === plan.id ? '#dc2626' : '#e2e8f0',
                        cursor: 'pointer',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: 500
                      }}
                      aria-label={deleteConfirm === plan.id ? 'Click again to confirm deletion' : 'Delete plan'}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      {deleteConfirm === plan.id ? 'Confirm' : 'Delete'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredPlans.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            No plans found matching your filters.
          </div>
        )}
      </div>
    </div>
  )
}
