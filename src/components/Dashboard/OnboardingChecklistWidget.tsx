import { useState, useId } from 'react';
import { Check, ChevronRight, X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  link: string;
}

interface OnboardingChecklistWidgetProps {
  items?: ChecklistItem[];
}

const DEFAULT_ITEMS: ChecklistItem[] = [
  { id: 'payout', label: 'Set up payout method', completed: false, link: '/onboarding/payout' },
  { id: 'brand', label: 'Upload brand pack', completed: false, link: '/branding' },
  { id: 'plan', label: 'Create your first plan', completed: false, link: '/plans?create=true' },
];

export default function OnboardingChecklistWidget({ items = DEFAULT_ITEMS }: OnboardingChecklistWidgetProps) {
  const [dismissed, setDismissed] = useState(false);
  const [checklistItems, setChecklistItems] = useState(items);
  const headingId = useId();
  const statusId = useId();

  const completedCount = checklistItems.filter(i => i.completed).length;
  const totalCount = checklistItems.length;
  const allComplete = completedCount === totalCount;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (dismissed) return null;

  const toggleItem = (id: string) => {
    setChecklistItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const circleCircumference = 2 * Math.PI * 20;

  return (
    <div className="dashboard-card" role="region" aria-labelledby={headingId}>
      <div className="dashboard-card__header">
        <h2 id={headingId} className="dashboard-section-title" style={{ fontSize: '1rem', margin: 0 }}>
          Getting Started
        </h2>
        {allComplete && (
          <button
            type="button"
            className="dashboard-muted-button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss checklist"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 0' }}>
        <div style={{ position: 'relative', width: '56px', height: '56px', flexShrink: 0 }} role="progressbar" aria-valuenow={completedCount} aria-valuemin={0} aria-valuemax={totalCount} aria-labelledby={statusId}>
          <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true">
            <circle cx="28" cy="28" r="20" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
            <circle
              cx="28" cy="28" r="20"
              fill="none"
              stroke="#22d3ee"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circleCircumference}
              strokeDashoffset={circleCircumference * (1 - progressPercent / 100)}
              transform="rotate(-90 28 28)"
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
            {completedCount}/{totalCount}
          </span>
        </div>
        <div id={statusId} style={{ fontSize: '13px', color: '#94a3b8' }}>
          {allComplete
            ? 'All setup steps complete!'
            : `${completedCount} of ${totalCount} steps done`}
        </div>
      </div>

      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }} role="list">
        {checklistItems.map(item => (
          <li key={item.id} role="listitem" style={{ marginBottom: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 8px', borderRadius: '8px', background: item.completed ? 'rgba(34,211,238,0.08)' : 'transparent', transition: 'background 0.2s' }}>
              <button
                type="button"
                onClick={() => toggleItem(item.id)}
                aria-label={`${item.completed ? 'Mark incomplete' : 'Mark complete'}: ${item.label}`}
                style={{ background: 'none', border: `2px solid ${item.completed ? '#22d3ee' : 'rgba(255,255,255,0.2)'}`, borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, padding: 0, backgroundColor: item.completed ? '#22d3ee' : 'transparent' }}
              >
                {item.completed && <Check size={12} stroke="#000" strokeWidth={3} aria-hidden="true" />}
              </button>
              <span style={{ flex: 1, fontSize: '14px', color: item.completed ? '#64748b' : '#f1f5f9', textDecoration: item.completed ? 'line-through' : 'none', transition: 'color 0.2s' }}>
                {item.label}
              </span>
              <Link
                to={item.link}
                style={{ color: '#22d3ee', display: 'flex', alignItems: 'center', textDecoration: 'none', fontSize: '13px' }}
                aria-label={`Go to ${item.label}`}
              >
                <ChevronRight size={16} />
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
