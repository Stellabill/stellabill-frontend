import { Save, ArrowLeft } from 'lucide-react'
import Button from '../common/Button'

interface WizardHeaderProps {
  title: string
  currentStep: number
  totalSteps: number
  isDirty: boolean
  onCancel: () => void
  onSaveDraft: () => void
}

export default function WizardHeader({
  title,
  currentStep,
  totalSteps,
  isDirty,
  onCancel,
  onSaveDraft,
}: WizardHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        paddingBottom: '1.5rem',
        marginBottom: '1.5rem',
        borderBottom: '1px solid #2a2a2a',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            border: '1px solid #3a3a3a',
            background: 'transparent',
            color: '#e2e8f0',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#555' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#3a3a3a' }}
        >
          <ArrowLeft size={18} />
        </button>

        <div>
          <h1
            style={{
              color: '#e2e8f0',
              fontSize: '1.25rem',
              fontWeight: 700,
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            {title}
          </h1>
          <span
            style={{
              color: '#64748b',
              fontSize: '0.75rem',
              fontWeight: 500,
            }}
          >
            Step {currentStep} of {totalSteps}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Button
          variant="outline"
          onClick={onSaveDraft}
          leftIcon={<Save size={16} />}
        >
          Save Draft
        </Button>
      </div>
    </div>
  )
}
