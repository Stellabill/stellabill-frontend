import React, { useRef, useEffect } from 'react';
import './PdfThumbnailNavigator.css';

export interface PdfThumbnailNavigatorProps {
  numPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const PdfThumbnailNavigator: React.FC<PdfThumbnailNavigatorProps> = ({
  numPages,
  currentPage,
  onPageChange,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    // Keep current page indicator anchored/visible when page changes
    const currentBtn = itemRefs.current[currentPage - 1];
    if (currentBtn && typeof currentBtn.scrollIntoView === 'function') {
      currentBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentPage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    let newPage = currentPage;
    let handled = false;

    switch (e.key) {
      case 'ArrowUp':
        newPage = Math.max(1, currentPage - 1);
        handled = true;
        break;
      case 'ArrowDown':
        newPage = Math.min(numPages, currentPage + 1);
        handled = true;
        break;
      case 'PageUp':
        newPage = Math.max(1, currentPage - 3); // Jump 3 pages
        handled = true;
        break;
      case 'PageDown':
        newPage = Math.min(numPages, currentPage + 3);
        handled = true;
        break;
      case 'Home':
        newPage = 1;
        handled = true;
        break;
      case 'End':
        newPage = numPages;
        handled = true;
        break;
      default:
        break;
    }

    if (handled) {
      e.preventDefault();
      if (newPage !== currentPage) {
        onPageChange(newPage);
        // Set focus to the new page thumbnail
        setTimeout(() => {
          itemRefs.current[newPage - 1]?.focus();
        }, 0);
      }
    }
  };

  const pages = Array.from({ length: numPages }, (_, i) => i + 1);

  return (
    <>
      <nav 
        className={`pdf-thumbnail-navigator ${className}`} 
        aria-label="PDF pages"
      >
        <div 
          className="pdf-thumbnail-navigator-rail"
          ref={containerRef}
          role="tablist"
          aria-orientation="vertical"
          onKeyDown={handleKeyDown}
        >
          {pages.map((page, idx) => {
            const isCurrent = page === currentPage;
            return (
              <button
                key={page}
                ref={(el) => (itemRefs.current[idx] = el)}
                className="pdf-thumbnail-btn"
                role="tab"
                aria-selected={isCurrent}
                aria-current={isCurrent ? 'true' : undefined}
                aria-label={`Page ${page} of ${numPages}`}
                tabIndex={isCurrent ? 0 : -1}
                onClick={() => onPageChange(page)}
              >
                <div className="pdf-thumbnail-page-number">{page}</div>
                <div className="pdf-thumbnail-label">Page {page}</div>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile chip fallback */}
      <div className={`pdf-mobile-chip-container ${className}`}>
        <div className="pdf-mobile-chip" role="status" aria-live="polite">
          Page {currentPage} of {numPages}
        </div>
      </div>
    </>
  );
};

export default PdfThumbnailNavigator;
