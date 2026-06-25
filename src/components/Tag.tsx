import { X } from 'lucide-react';
import './Tag.css';

export interface TagProps {
  label: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'pink' | 'orange' | 'gray';
  size?: 'small' | 'medium';
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
}

export default function Tag({
  label,
  color = 'blue',
  size = 'medium',
  removable = false,
  onRemove,
  className = '',
}: TagProps) {
  const chipClass = `tag tag--${size} tag--${color} ${className}`;

  return (
    <span className={chipClass} role="status" aria-label={`Tag: ${label}`}>
      <span className="tag__text">{label}</span>
      {removable && onRemove && (
        <button
          type="button"
          className="tag__remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label={`Remove ${label} tag`}
        >
          <X size={size === 'small' ? 12 : 14} />
        </button>
      )}
    </span>
  );
}
