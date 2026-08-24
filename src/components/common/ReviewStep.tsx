import React from 'react';
import { Edit3, HelpCircle } from 'lucide-react';
import { Button } from './Button';

interface ReviewSection {
  id: string;
  label: string;
  value: string;
  editLink: string;
}

interface ReviewStepProps {
  title: string;
  subtitle?: string;
  sections: ReviewSection[];
  onSectionEdit: (sectionId: string) => void;
  primaryAction: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  footerHelp?: {
    label: string;
    onClick: () => void;
  };
}

export function ReviewStep({
  title,
  subtitle,
  sections,
  onSectionEdit,
  primaryAction,
  secondaryAction,
  footerHelp,
}: ReviewStepProps) {
  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 4px' }}>{title}</h2>
        {subtitle && (
          <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>{subtitle}</p>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
        {sections.map((section) => (
          <div
            key={section.id}
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                {section.label}
              </div>
              <div style={{ fontSize: '15px', color: '#f1f5f9' }}>{section.value}</div>
            </div>
            <button
              type="button"
              onClick={() => onSectionEdit(section.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: '#22d3ee',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '13px',
                flexShrink: 0,
              }}
              aria-label={`Edit ${section.label}`}
            >
              <Edit3 size={14} aria-hidden="true" />
              Edit
            </button>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        {secondaryAction && (
          <Button variant="ghost" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </Button>
        )}
        <Button
          variant="primary"
          onClick={primaryAction.onClick}
          disabled={primaryAction.disabled}
          isLoading={primaryAction.loading}
        >
          {primaryAction.label}
        </Button>
      </div>

      {footerHelp && (
        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={footerHelp.onClick}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              fontSize: '13px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <HelpCircle size={13} aria-hidden="true" />
            {footerHelp.label}
          </button>
        </div>
      )}
    </div>
  );
}

export default ReviewStep;
