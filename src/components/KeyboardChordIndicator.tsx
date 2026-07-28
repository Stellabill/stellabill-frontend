import { useEffect, useState } from 'react';
import './KeyboardChordIndicator.css';

interface KeyboardChordIndicatorProps {
  /** The first key of the chord that was pressed, or null if no chord is pending */
  pendingKey: string | null;
}

/**
 * Displays a floating badge when a keyboard chord is initiated.
 * E.g., user presses 'g', and is waiting for the next key.
 * Provides accessible polite announcements.
 */
export default function KeyboardChordIndicator({ pendingKey }: KeyboardChordIndicatorProps) {
  const [displayKey, setDisplayKey] = useState<string | null>(null);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (pendingKey) {
      setDisplayKey(pendingKey);
      setIsExiting(false);
    } else if (displayKey) {
      setIsExiting(true);
      const timer = setTimeout(() => {
        setDisplayKey(null);
        setIsExiting(false);
      }, 300); // Wait for exit animation
      return () => clearTimeout(timer);
    }
  }, [pendingKey, displayKey]);

  if (!displayKey && !isExiting) return null;

  return (
    <div 
      className={`kb-chord-indicator ${isExiting ? 'kb-chord-indicator--exit' : 'kb-chord-indicator--enter'}`}
      role="status"
    >
      <div className="kb-chord-indicator-content" aria-hidden="true">
        <kbd className="kb-chord-indicator-key">{displayKey}</kbd>
        <span className="kb-chord-indicator-text">waiting for next key...</span>
      </div>
      {/* Screen reader only announcement */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="kb-chord-sr-only"
      >
        {pendingKey ? `Chord started with ${pendingKey}. Waiting for next key...` : 'Chord cancelled.'}
      </div>
    </div>
  );
}
