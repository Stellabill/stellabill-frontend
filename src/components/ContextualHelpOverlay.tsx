import { useEffect, useState, useRef, MouseEvent } from 'react';
import './ContextualHelpOverlay.css';

interface HelpItem {
  id: string;
  element: HTMLElement;
  rect: DOMRect;
  text: string;
}

interface ContextualHelpOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ContextualHelpOverlay({ isOpen, onClose }: ContextualHelpOverlayProps) {
  const [helpItems, setHelpItems] = useState<HelpItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setHelpItems([]);
      return;
    }

    const updateItems = () => {
      const elements = document.querySelectorAll<HTMLElement>('[data-help]');
      const items: HelpItem[] = Array.from(elements).map((element, index) => {
        return {
          id: `help-item-${index}`,
          element,
          rect: element.getBoundingClientRect(),
          text: element.getAttribute('data-help') || '',
        };
      });
      setHelpItems(items);
    };

    updateItems();

    // Re-calculate on scroll or resize
    window.addEventListener('resize', updateItems);
    window.addEventListener('scroll', updateItems, true); // true for capturing scroll in scrollable areas

    return () => {
      window.removeEventListener('resize', updateItems);
      window.removeEventListener('scroll', updateItems, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handlePrint = () => {
    window.print();
  };

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="ctx-help-overlay"
      role="presentation"
      onMouseDown={handleBackdropClick}
      ref={containerRef}
    >
      {/* Screen reader summary */}
      <div className="sr-only" role="dialog" aria-modal="true" aria-label="Contextual Help">
        <h2>Contextual Help</h2>
        <p>Press Escape to close.</p>
        <ol>
          {helpItems.map((item, i) => (
            <li key={item.id}>
              {item.text}
            </li>
          ))}
        </ol>
      </div>

      <svg className="ctx-help-connectors" aria-hidden="true">
        {helpItems.map((item, i) => {
          const x = item.rect.left + item.rect.width / 2;
          const y = item.rect.top + item.rect.height / 2;
          
          const calloutX = item.rect.left + item.rect.width / 2;
          const calloutY = item.rect.bottom + 40;

          return (
            <line
              key={`connector-${item.id}`}
              x1={x}
              y1={y}
              x2={calloutX}
              y2={calloutY}
              className="ctx-help-line"
            />
          );
        })}
      </svg>

      {helpItems.map((item, i) => {
        const top = item.rect.bottom + 20; 
        const left = item.rect.left + item.rect.width / 2; 

        return (
          <div
            key={item.id}
            className="ctx-help-callout"
            style={{
              top: `${top}px`,
              left: `${left}px`,
              transform: 'translateX(-50%)'
            }}
            aria-hidden="true"
          >
            <span className="ctx-help-number">{i + 1}</span>
            <span className="ctx-help-text">{item.text}</span>
          </div>
        );
      })}

      {helpItems.map((item) => (
        <div
          key={`highlight-${item.id}`}
          className="ctx-help-highlight"
          style={{
            top: `${item.rect.top}px`,
            left: `${item.rect.left}px`,
            width: `${item.rect.width}px`,
            height: `${item.rect.height}px`,
          }}
          aria-hidden="true"
        />
      ))}

      <div className="ctx-help-actions">
        <button
          type="button"
          className="ctx-help-print-btn"
          onClick={handlePrint}
          aria-label="Print help sheet"
        >
          <svg
            className="ctx-help-print-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          Print Help Sheet
        </button>
      </div>
    </div>
  );
}
