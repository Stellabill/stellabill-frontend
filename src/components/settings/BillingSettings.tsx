import { useState } from 'react'
import { Save, CreditCard, Plus, Trash2, Download } from 'lucide-react'
import ConfirmDialog from '../common/ConfirmDialog'
import DangerZone, { DangerZoneItem } from '../common/DangerZone'
import { FieldLabelWithHelp } from '../common/FieldHelpPopover'
import { ToastContainer } from '../TransactionToast'
import { useSubscriptionActions } from '../../hooks/useSubscriptionActions'
import type { SubscriptionStatus } from '../../types/subscription'

interface PaymentMethod {
  id: string
  type: 'card' | 'bank'
  last4: string
  brand?: string
  expiry?: string
  isDefault: boolean
  addedAt: string
}

export interface BillingPreferences {
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

export type BillingPrefs = BillingPreferences

export interface BillingSettingsProps {
  onSave?: (prefs: BillingPreferences) => Promise<void>
}

export default function BillingSettings({ onSave }: BillingSettingsProps = {}) {
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

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
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
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [showAddPaymentMethod, setShowAddPaymentMethod] = useState(false)
  const [pendingRemovalId, setPendingRemovalId] = useState<string | null>(null)
  const [showCancelSubscription, setShowCancelSubscription] = useState(false)

  const pendingRemoval = paymentMethods.find((m) => m.id === pendingRemovalId) ?? null

  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus(null)
    try {
      await onSave?.(billingPrefs)
      setSaveStatus({ type: 'success', message: 'Saved' })
      setIsEditing(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save billing preferences'
      setSaveStatus({ type: 'error', message })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSetDefaultPaymentMethod = (id: string) => {
    setPaymentMethods((prev) => prev.map((m) => ({ ...m, isDefault: m.id === id })))
  }

  const requestRemovePaymentMethod = (id: string) => {
    setPendingRemovalId(id)
  }

  const confirmRemovePaymentMethod = () => {
    if (!pendingRemovalId) return
    setPaymentMethods((prev) => prev.filter((m) => m.id !== pendingRemovalId))
    setPendingRemovalId(null)
  }

  const confirmCancelSubscription = async () => {
    const previousStatus = subscriptionStatus
    await cancel(subscriptionId, {
      onOptimistic: () => {
        setSubscriptionStatus('Cancelled')
      },
      onRollback: () => {
        setSubscriptionStatus(previousStatus)
      },
      onSuccess: () => {
        setShowCancelSubscription(false)
      },
    })
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
          Billing Settings
        </h2>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
          Configure payment methods, billing cycles, and invoice preferences
        </p>
      </div>

      {/* Billing Preferences */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CreditCard size={20} style={{ color: 'var(--color-brand-primary)' }} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Billing Preferences
            </h3>
          </div>
          <button
            onClick={() => {
              setIsEditing(!isEditing)
              setSaveStatus(null)
            }}
            disabled={isSaving}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: '1px solid var(--color-border-default)',
              background: 'transparent',
              color: 'var(--color-text-primary)',
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        <div style={{ background: 'var(--color-surface-card)', borderRadius: '6px', padding: '1.5rem', border: '1px solid var(--color-border-subtle)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <div>
              <FieldLabelWithHelp
                htmlFor="billing-cycle"
                helpTitle="Billing cycle"
                help={<p>Sets the default renewal cadence for this account. Yearly billing uses the annual discount shown in the menu.</p>}
                style={{ display: 'inline-flex', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}
              >
                Billing Cycle
              </FieldLabelWithHelp>
              <select
                id="billing-cycle"
                value={billingPrefs.billingCycle}
                onChange={(e) => setBillingPrefs({ ...billingPrefs, billingCycle: e.target.value as 'monthly' | 'yearly' })}
                disabled={!isEditing}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  border: '1px solid var(--color-border-default)',
                  background: isEditing ? 'var(--color-surface-control)' : 'var(--color-surface-subtle)',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.875rem',
                  opacity: isEditing ? 1 : 0.7,
                }}
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly (Save 20%)</option>
              </select>
            </div>

            <div>
              <FieldLabelWithHelp
                htmlFor="invoice-email"
                helpTitle="Invoice email"
                help={<p>Invoices, receipts, and billing failure notices are sent to this address.</p>}
                style={{ display: 'inline-flex', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}
              >
                Invoice Email
              </FieldLabelWithHelp>
              <input
                id="invoice-email"
                type="email"
                value={billingPrefs.invoiceEmail}
                onChange={(e) => setBillingPrefs({ ...billingPrefs, invoiceEmail: e.target.value })}
                disabled={!isEditing}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  border: '1px solid var(--color-border-default)',
                  background: isEditing ? 'var(--color-surface-control)' : 'var(--color-surface-subtle)',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.875rem',
                  opacity: isEditing ? 1 : 0.7,
                }}
              />
            </div>

            <div>
              <FieldLabelWithHelp
                htmlFor="tax-id"
                optional
                helpTitle="Tax ID"
                help={<p>Add a business tax identifier when it needs to appear on invoices for accounting or compliance.</p>}
                style={{ display: 'inline-flex', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}
              >
                Tax ID
              </FieldLabelWithHelp>
              <input
                id="tax-id"
                type="text"
                value={billingPrefs.taxId}
                onChange={(e) => setBillingPrefs({ ...billingPrefs, taxId: e.target.value })}
                disabled={!isEditing}
                placeholder="e.g., 12-3456789"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  border: '1px solid var(--color-border-default)',
                  background: isEditing ? 'var(--color-surface-control)' : 'var(--color-surface-subtle)',
                  color: 'var(--color-text-primary)',
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
                  accentColor: 'var(--color-brand-primary)',
                  cursor: isEditing ? 'pointer' : 'default',
                }}
              />
              <div>
                <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>Enable Auto-Pay</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
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
                  accentColor: 'var(--color-brand-primary)',
                  cursor: isEditing ? 'pointer' : 'default',
                }}
              />
              <div>
                <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>Email Invoices</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                  Send invoice copies to the billing email address
                </div>
              </div>
            </label>
          </div>

          {isEditing && (
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border-default)',
                  background: 'transparent',
                  color: 'var(--color-text-muted)',
                  fontSize: '0.875rem',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  opacity: isSaving ? 0.6 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                aria-label="Save Changes"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'var(--color-brand-gradient)',
                  color: 'var(--color-brand-on)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  opacity: isSaving ? 0.6 : 1,
                }}
              >
                <Save size={16} />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}

          {saveStatus && (
            <div
              role={saveStatus.type === 'error' ? 'alert' : 'status'}
              style={{
                marginTop: '1rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: saveStatus.type === 'error' ? '#ef4444' : '#10b981',
              }}
            >
              {saveStatus.message}
            </div>
          )}
        </div>
      </div>

      {/* Payment Methods */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CreditCard size={20} style={{ color: 'var(--color-brand-primary)' }} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Payment Methods
            </h3>
            <span style={{ background: 'var(--color-surface-subtle)', color: 'var(--color-text-muted)', fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
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
              border: '1px solid var(--color-border-default)',
              background: 'transparent',
              color: 'var(--color-text-primary)',
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            <Plus size={14} />
            Add Method
          </button>
        </div>

        <div style={{ background: 'var(--color-surface-card)', borderRadius: '6px', border: '1px solid var(--color-border-subtle)', overflow: 'hidden' }}>
          {paymentMethods.map((method, index) => (
            <div
              key={method.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 1.5rem',
                borderBottom: index < paymentMethods.length - 1 ? '1px solid var(--color-border-subtle)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div
                  style={{
                    width: '48px',
                    height: '32px',
                    borderRadius: '4px',
                    background:
                      method.brand === 'Visa'
                        ? 'var(--color-info-bg)'
                        : method.brand === 'Mastercard'
                        ? 'var(--color-danger-bg)'
                        : 'var(--color-surface-subtle)',
                    border:
                      method.brand === 'Visa'
                        ? '1px solid var(--color-info-border)'
                        : method.brand === 'Mastercard'
                        ? '1px solid var(--color-danger-border)'
                        : '1px solid var(--color-border-default)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color:
                      method.brand === 'Visa'
                        ? 'var(--color-info)'
                        : method.brand === 'Mastercard'
                        ? 'var(--color-danger)'
                        : 'var(--color-text-secondary)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                >
                  {method.brand?.toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                      {method.brand} •••• {method.last4}
                    </span>
                    {method.isDefault && (
                      <span style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)', border: '1px solid var(--color-success-border)', fontSize: '0.75rem', padding: '0.125rem 0.5rem', borderRadius: '4px', fontWeight: 500 }}>
                        Default
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
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
                      border: '1px solid var(--color-border-default)',
                      background: 'transparent',
                      color: 'var(--color-text-muted)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    Set Default
                  </button>
                )}
                <button
                  onClick={() => requestRemovePaymentMethod(method.id)}
                  aria-label={`Remove payment method ending in ${method.last4}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.375rem 0.75rem',
                    borderRadius: '4px',
                    border: '1px solid var(--color-danger-border)',
                    background: 'transparent',
                    color: 'var(--color-danger)',
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
            <Download size={20} style={{ color: 'var(--color-brand-primary)' }} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
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
              border: '1px solid var(--color-border-default)',
              background: 'transparent',
              color: 'var(--color-text-primary)',
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            <Download size={14} />
            Export All
          </button>
        </div>

        <div style={{ background: 'var(--color-surface-card)', borderRadius: '6px', border: '1px solid var(--color-border-subtle)', padding: '1rem' }}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>No billing history available</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-subtle)' }}>
              Your invoices and payment history will appear here
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div style={{ marginTop: '2rem' }}>
        <DangerZone description="Destructive billing actions. These cannot be undone — read each warning carefully.">
          <DangerZoneItem
            title="Cancel subscription"
            description={
              subscriptionStatus === 'Cancelled'
                ? 'Your subscription has been cancelled.'
                : 'Cancel your active subscription. Your remaining prepaid balance can be withdrawn before the end of the current billing period.'
            }
            actionLabel={subscriptionStatus === 'Cancelled' ? 'Subscription cancelled' : 'Cancel subscription'}
            actionAriaLabel="Cancel subscription: Cancel subscription"
            actionIcon={<Trash2 size={14} aria-hidden="true" />}
            disabled={isPending || subscriptionStatus === 'Cancelled'}
            onAction={() => setShowCancelSubscription(true)}
          />
        </DangerZone>
      </div>

      {/* Remove Payment Method Confirmation */}
      <ConfirmDialog
        isOpen={pendingRemovalId !== null}
        title="Remove payment method?"
        description={
          pendingRemoval
            ? `${pendingRemoval.brand} ending in ${pendingRemoval.last4} will no longer be available for charges.`
            : 'This payment method will no longer be available for charges.'
        }
        consequences={[
          'Auto-pay will fail if this is the last payment method on file.',
          'Pending invoices may need to be paid manually.',
        ]}
        confirmLabel="Remove method"
        cancelLabel="Keep method"
        onClose={() => setPendingRemovalId(null)}
        onConfirm={confirmRemovePaymentMethod}
      />

      {/* Cancel Subscription Confirmation */}
      <ConfirmDialog
        isOpen={showCancelSubscription}
        title="Cancel subscription?"
        description="Your subscription will be cancelled at the end of the current billing period. You can resubscribe at any time."
        consequences={[
          'You will not be charged again.',
          'Access continues until the end of the current period.',
          'Remaining prepaid balance can be withdrawn from your wallet.',
        ]}
        confirmLabel="Cancel subscription"
        cancelLabel="Keep subscription"
        loadingLabel="Cancelling..."
        isLoading={isCancelling}
        onClose={() => setShowCancelSubscription(false)}
        onConfirm={confirmCancelSubscription}
      />

      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Add Payment Method Modal */}
      {showAddPaymentMethod && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'var(--color-surface-overlay)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'var(--color-surface-elevated)',
            borderRadius: '8px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            border: '1px solid var(--color-border-default)',
          }}>
            <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Add Payment Method
            </h3>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                Card Number
              </label>
              <input
                type="text"
                placeholder="1234 5678 9012 3456"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  border: '1px solid var(--color-border-default)',
                  background: 'var(--color-surface-control)',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.875rem',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                  Expiry Date
                </label>
                <input
                  type="text"
                  placeholder="MM/YY"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '4px',
                    border: '1px solid var(--color-border-default)',
                    background: 'var(--color-surface-control)',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.875rem',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                  CVC
                </label>
                <input
                  type="text"
                  placeholder="123"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '4px',
                    border: '1px solid var(--color-border-default)',
                    background: 'var(--color-surface-control)',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.875rem',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                Cardholder Name
              </label>
              <input
                type="text"
                placeholder="John Doe"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  border: '1px solid var(--color-border-default)',
                  background: 'var(--color-surface-control)',
                  color: 'var(--color-text-primary)',
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
                  border: '1px solid var(--color-border-default)',
                  background: 'transparent',
                  color: 'var(--color-text-muted)',
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
                  background: 'var(--color-brand-gradient)',
                  color: 'var(--color-brand-on)',
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
