import { useState } from 'react'
import { Save, CreditCard, Plus, Trash2, Download, AlertTriangle, Check } from 'lucide-react'

interface PaymentMethod {
  id: string
  type: 'card' | 'bank'
  last4: string
  brand?: string
  expiry?: string
  isDefault: boolean
  addedAt: string
}

interface BillingPreferences {
  billingCycle: 'monthly' | 'yearly'
  autoPay: boolean
  emailInvoices: boolean
  invoiceEmail: string
  taxId: string
  billingAddress: {
    line1: string
    line2: string
    city: string
    state: string
    postalCode: string
    country: string
  }
}

export default function BillingSettings() {
  const [billingPrefs, setBillingPrefs] = useState<BillingPreferences>({
    billingCycle: 'monthly',
    autoPay: true,
    emailInvoices: true,
    invoiceEmail: 'billing@acme.com',
    taxId: '',
    billingAddress: {
      line1: '123 Business St',
      line2: 'Suite 100',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94105',
      country: 'US',
    },
  })

  const [paymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'card',
      last4: '4242',
      brand: 'Visa',
      expiry: '12/25',
      isDefault: true,
      addedAt: '2024-01-15',
    },
    {
      id: '2',
      type: 'card',
      last4: '5555',
      brand: 'Mastercard',
      expiry: '09/24',
      isDefault: false,
      addedAt: '2024-02-01',
    },
  ])

  const [isEditing, setIsEditing] = useState(false)
  const [showAddPaymentMethod, setShowAddPaymentMethod] = useState(false)

  const handleSave = () => {
    console.log('Saving billing preferences:', billingPrefs)
    setIsEditing(false)
  }

  const handleSetDefaultPaymentMethod = (id: string) => {
    // TODO: Implement set default logic
    console.log('Setting default payment method:', id)
  }

  const handleRemovePaymentMethod = (id: string) => {
    // TODO: Implement remove logic with confirmation
    console.log('Removing payment method:', id)
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.5rem' }}>
          Billing Settings
        </h2>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
          Configure payment methods, billing cycles, and invoice preferences
        </p>
      </div>

      {/* Billing Preferences */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CreditCard size={20} style={{ color: '#67d5f0' }} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#e2e8f0' }}>
              Billing Preferences
            </h3>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: '1px solid #2d2d44',
              background: 'transparent',
              color: '#e2e8f0',
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        <div style={{ background: '#0a0a0a', borderRadius: '6px', padding: '1.5rem', border: '1px solid #2d2d44' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#94a3b8', marginBottom: '0.5rem' }}>
                Billing Cycle
              </label>
              <select
                value={billingPrefs.billingCycle}
                onChange={(e) => setBillingPrefs({ ...billingPrefs, billingCycle: e.target.value as 'monthly' | 'yearly' })}
                disabled={!isEditing}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  border: '1px solid #2d2d44',
                  background: isEditing ? '#1a1a2e' : '#0f0f0f',
                  color: '#e2e8f0',
                  fontSize: '0.875rem',
                  opacity: isEditing ? 1 : 0.7,
                }}
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly (Save 20%)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#94a3b8', marginBottom: '0.5rem' }}>
                Invoice Email
              </label>
              <input
                type="email"
                value={billingPrefs.invoiceEmail}
                onChange={(e) => setBillingPrefs({ ...billingPrefs, invoiceEmail: e.target.value })}
                disabled={!isEditing}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  border: '1px solid #2d2d44',
                  background: isEditing ? '#1a1a2e' : '#0f0f0f',
                  color: '#e2e8f0',
                  fontSize: '0.875rem',
                  opacity: isEditing ? 1 : 0.7,
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#94a3b8', marginBottom: '0.5rem' }}>
                Tax ID (Optional)
              </label>
              <input
                type="text"
                value={billingPrefs.taxId}
                onChange={(e) => setBillingPrefs({ ...billingPrefs, taxId: e.target.value })}
                disabled={!isEditing}
                placeholder="e.g., 12-3456789"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  border: '1px solid #2d2d44',
                  background: isEditing ? '#1a1a2e' : '#0f0f0f',
                  color: '#e2e8f0',
                  fontSize: '0.875rem',
                  opacity: isEditing ? 1 : 0.7,
                }}
              />
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: isEditing ? 'pointer' : 'default' }}>
              <input
                type="checkbox"
                checked={billingPrefs.autoPay}
                onChange={(e) => setBillingPrefs({ ...billingPrefs, autoPay: e.target.checked })}
                disabled={!isEditing}
                style={{
                  width: '18px',
                  height: '18px',
                  accentColor: '#67d5f0',
                  cursor: isEditing ? 'pointer' : 'default',
                }}
              />
              <div>
                <div style={{ fontWeight: 500, color: '#e2e8f0' }}>Enable Auto-Pay</div>
                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                  Automatically charge payment methods when invoices are due
                </div>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: isEditing ? 'pointer' : 'default' }}>
              <input
                type="checkbox"
                checked={billingPrefs.emailInvoices}
                onChange={(e) => setBillingPrefs({ ...billingPrefs, emailInvoices: e.target.checked })}
                disabled={!isEditing}
                style={{
                  width: '18px',
                  height: '18px',
                  accentColor: '#67d5f0',
                  cursor: isEditing ? 'pointer' : 'default',
                }}
              />
              <div>
                <div style={{ fontWeight: 500, color: '#e2e8f0' }}>Email Invoices</div>
                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                  Send invoice copies to the billing email address
                </div>
              </div>
            </label>
          </div>

          {isEditing && (
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setIsEditing(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  border: '1px solid #2d2d44',
                  background: 'transparent',
                  color: '#94a3b8',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #67d5f0, #5ce0b8)',
                  color: '#fff',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Save size={16} />
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Payment Methods */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CreditCard size={20} style={{ color: '#67d5f0' }} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#e2e8f0' }}>
              Payment Methods
            </h3>
            <span style={{ background: '#2d2d44', color: '#94a3b8', fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
              {paymentMethods.length} methods
            </span>
          </div>
          <button
            onClick={() => setShowAddPaymentMethod(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: '1px solid #2d2d44',
              background: 'transparent',
              color: '#e2e8f0',
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            <Plus size={14} />
            Add Method
          </button>
        </div>

        <div style={{ background: '#0a0a0a', borderRadius: '6px', border: '1px solid #2d2d44', overflow: 'hidden' }}>
          {paymentMethods.map((method, index) => (
            <div
              key={method.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 1.5rem',
                borderBottom: index < paymentMethods.length - 1 ? '1px solid #2d2d44' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div
                  style={{
                    width: '48px',
                    height: '32px',
                    borderRadius: '4px',
                    background: method.brand === 'Visa' ? '#1a1f71' : method.brand === 'Mastercard' ? '#eb001b' : '#2d2d44',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                >
                  {method.brand?.toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 500, color: '#e2e8f0' }}>
                      {method.brand} •••• {method.last4}
                    </span>
                    {method.isDefault && (
                      <span style={{ background: '#10b981', color: '#fff', fontSize: '0.75rem', padding: '0.125rem 0.5rem', borderRadius: '4px', fontWeight: 500 }}>
                        Default
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                    Expires {method.expiry} • Added {new Date(method.addedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {!method.isDefault && (
                  <button
                    onClick={() => handleSetDefaultPaymentMethod(method.id)}
                    style={{
                      padding: '0.375rem 0.75rem',
                      borderRadius: '4px',
                      border: '1px solid #2d2d44',
                      background: 'transparent',
                      color: '#94a3b8',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    Set Default
                  </button>
                )}
                <button
                  onClick={() => handleRemovePaymentMethod(method.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.375rem 0.75rem',
                    borderRadius: '4px',
                    border: '1px solid #dc2626',
                    background: 'transparent',
                    color: '#ef4444',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={12} />
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Billing History */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Download size={20} style={{ color: '#67d5f0' }} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#e2e8f0' }}>
              Billing History
            </h3>
          </div>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: '1px solid #2d2d44',
              background: 'transparent',
              color: '#e2e8f0',
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            <Download size={14} />
            Export All
          </button>
        </div>

        <div style={{ background: '#0a0a0a', borderRadius: '6px', border: '1px solid #2d2d44', padding: '1rem' }}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ color: '#64748b', marginBottom: '0.5rem' }}>No billing history available</div>
            <div style={{ fontSize: '0.875rem', color: '#475569' }}>
              Your invoices and payment history will appear here
            </div>
          </div>
        </div>
      </div>

      {/* Add Payment Method Modal */}
      {showAddPaymentMethod && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: '#1a1a2e',
            borderRadius: '8px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            border: '1px solid #2d2d44',
          }}>
            <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem', fontWeight: 600, color: '#e2e8f0' }}>
              Add Payment Method
            </h3>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#94a3b8', marginBottom: '0.5rem' }}>
                Card Number
              </label>
              <input
                type="text"
                placeholder="1234 5678 9012 3456"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  border: '1px solid #2d2d44',
                  background: '#0a0a0a',
                  color: '#e2e8f0',
                  fontSize: '0.875rem',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#94a3b8', marginBottom: '0.5rem' }}>
                  Expiry Date
                </label>
                <input
                  type="text"
                  placeholder="MM/YY"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '4px',
                    border: '1px solid #2d2d44',
                    background: '#0a0a0a',
                    color: '#e2e8f0',
                    fontSize: '0.875rem',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#94a3b8', marginBottom: '0.5rem' }}>
                  CVC
                </label>
                <input
                  type="text"
                  placeholder="123"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '4px',
                    border: '1px solid #2d2d44',
                    background: '#0a0a0a',
                    color: '#e2e8f0',
                    fontSize: '0.875rem',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#94a3b8', marginBottom: '0.5rem' }}>
                Cardholder Name
              </label>
              <input
                type="text"
                placeholder="John Doe"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  border: '1px solid #2d2d44',
                  background: '#0a0a0a',
                  color: '#e2e8f0',
                  fontSize: '0.875rem',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setShowAddPaymentMethod(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  border: '1px solid #2d2d44',
                  background: 'transparent',
                  color: '#94a3b8',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => setShowAddPaymentMethod(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #67d5f0, #5ce0b8)',
                  color: '#fff',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Plus size={16} />
                Add Payment Method
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
